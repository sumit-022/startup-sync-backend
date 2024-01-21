/**
 * job controller
 */

import { factories } from "@strapi/strapi";
import fs from "fs";
import { matchBaseUrl } from "../../../utils/match";
import { encrypt } from "../../../utils/encode-decode";

export default factories.createCoreController("api::job.job", ({ strapi }) => ({
  async create(ctx) {
    // Automatically generate the job code based on the last job code using the job service
    const jobCode = await strapi.service("api::job.job").generateJobCode();
    // Set the job code
    ctx.request.body.jobCode = jobCode;

    console.log({ jobCode });

    console.log({ body: ctx.request.body });

    // // Parse the CSV file using the job service
    // const json = await strapi
    //   .service("api::job.job")
    //   .parseCSV(ctx.request.files.file);

    // // Create the dynamic zone data
    // const dynamicZoneData = json.map((item: any) => ({
    //   __component: "api.job.spares",
    //   ...item,
    // }));

    // // Set the dynamic zone data
    // ctx.request.body.spares = dynamicZoneData;

    // Create the job
    const job = await strapi
      .service("api::job.job")
      .create({ data: ctx.request.body });

    // Return the job
    return job;
  },

  async sendRFQForm(ctx) {
    // TODO: Allow custom attachments for each vendor

    type Vendor = { id: number; attachment: File };

    // Get the jobcode from the request body
    let { jobId: id } = ctx.request.body;
    const spareDetails = JSON.parse(ctx.request.body.spareDetails) as any[];
    const vendors = JSON.parse(ctx.request.body.vendors) as Vendor[];
    const files = ctx.request.files;

    let origin = ctx.request.body.origin || ctx.request.headers.origin;

    origin = matchBaseUrl(origin);
    if (!origin || origin === false) {
      return ctx.badRequest("Invalid origin");
    }

    let attachment = files.attachment;

    if (attachment.size > 10 * 1024 * 1024)
      return ctx.badRequest("Attachment too large");

    const buffer = fs.readFileSync(attachment.path);

    if (!id) return ctx.badRequest("Job id is required");

    // Get the job
    const job = await strapi.entityService.findOne("api::job.job", id);

    if (!job) return ctx.notFound("Job not found");
    if (job.status === "RFQSENT")
      return ctx.badRequest("RFQ form already generated");

    // Get the vendor emails
    const vendorMails = await strapi.entityService.findMany(
      "api::vendor.vendor",
      {
        filters: {
          id: vendors.map(({ id }) => id),
        },
        fields: ["id", "email"],
      }
    );

    console.log({ vendorMails });

    if (!Array.isArray(vendorMails) || vendorMails.length !== vendors.length)
      return ctx.badRequest("Invalid vendor id");

    // Create the spares
    const spares = await Promise.allSettled(
      spareDetails.map((spareDetail: any) =>
        strapi.entityService.create("api::spare.spare", {
          data: {
            title: spareDetail.title,
            make: spareDetail.make,
            model: spareDetail.model,
            job: job.id,
          },
        })
      )
    );

    const unSettledSpares = spares.filter(
      ({ status }) => status === "rejected"
    );

    // Generate the RFQ number
    const rfqNumber = strapi
      .service("api::job.job")
      .generateRFQNumber(job.jobCode);

    // Generate a draft RFQ form for each vendor and each spare
    const rfqForms = await Promise.allSettled(
      vendors
        .map((vendor) =>
          spareDetails.map((spareDetail) =>
            strapi.entityService.create("api::rfq.rfq", {
              data: {
                RFQNumber: rfqNumber,
                spare: spareDetail.id,
                quotedPrice: 0,
                vendor: vendor.id,
              },
            })
          )
        )
        .flat()
    );

    const unSettledRFQForms = rfqForms.filter(
      ({ status }) => status === "rejected"
    );

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

    if (ENCRYPTION_KEY === "") {
      console.warn("Encryption key not set");
    }

    // Send mails to every vendor
    const mails = await Promise.allSettled(
      vendorMails.map((vendor) =>
        strapi.plugins["email"].services.email.send({
          to: (vendor as any).email,
          subject: "Request for Quotation - Shinpo Engineering",
          html: `Fill the form at ${origin}/vendor/form/rfq/${encrypt(
            rfqNumber,
            ENCRYPTION_KEY
          )}/${encrypt(vendor.id.toString(), ENCRYPTION_KEY)}`,
          attachments: buffer && [
            {
              filename: attachment.name,
              content: buffer,
            },
          ],
        })
      )
    );

    const unSettledMails = mails.filter(({ status }) => status === "rejected");

    // Update the job status
    await strapi.entityService.update("api::job.job", job.id, {
      data: {
        id: job.id,
        status: "RFQSENT",
        RFQNumber: rfqNumber,
      },
    });

    return {
      spares: spares,
      rfqForms,
      mails,
      unSettledSpares,
      unSettledRFQForms,
      unSettledMails,
    };
  },
}));
