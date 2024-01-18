/**
 * job controller
 */

import { factories } from "@strapi/strapi";
import fs from "fs";

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

  async createRFQForm(ctx) {
    // TODO: Allow custom attachments for each vendor

    // Get the jobcode from the request body
    let { jobId: id, spareDetails, vendors } = ctx.request.body;
    const files = ctx.request.files;

    spareDetails = JSON.parse(spareDetails);
    vendors = JSON.parse(vendors);
    let attachment = files.attachment;

    if (attachment.size > 10 * 1024 * 1024)
      return ctx.badRequest("Attachment too large");

    const buffer = fs.readFileSync(attachment.path);

    if (!id) return ctx.badRequest("Job id is required");

    // Get the job
    const job = await strapi.entityService.findOne("api::job.job", id, {
      populate: ["RFQForm"],
    });

    if (!job) return ctx.notFound("Job not found");
    if (job.RFQForm) return ctx.badRequest("RFQ form already generated");

    // Generate the RFQ number
    const rfqNumber = strapi
      .service("api::job.job")
      .generateRFQNumber(job.jobCode);

    const rfqForm = {
      shipName: job.shipName,
      RFQNumber: rfqNumber,
      SpareDetails: (spareDetails ?? []).map((spareDetail: any) => ({
        name: spareDetail.name,
        quantity: spareDetail.quantity,
        description: spareDetail.description,
      })),
      vendors: vendors && {
        connect: vendors.map((vendor: any) => vendor.id),
      },
    };

    // Create the RFQ form
    const updatedJob = await strapi.entityService.update(
      "api::job.job",
      job.id,
      {
        data: {
          ...job,
          id: job.id,
          RFQForm: rfqForm,
        },
        populate: {
          RFQForm: {
            populate: ["vendors", "SpareDetails"],
          },
        },
      }
    );

    const vendorMails = (updatedJob.RFQForm as any).vendors.map(
      (vendor: any) => vendor.email
    ) as string[];

    // Send mails to every vendor
    const mails = await Promise.allSettled(
      vendorMails.map((vendorMail) =>
        strapi.plugins["email"].services.email.send({
          to: vendorMail,
          subject: "Request for Quotation - Shinpo Engineering",
          attachments: buffer && [
            {
              filename: attachment.name,
              content: buffer,
            },
          ],
        })
      )
    );

    mails.forEach(
      ({ status }, idx) =>
        status === "rejected" &&
        console.warn(`Mail to ${vendorMails[idx]} failed`)
    );

    return updatedJob;
  },
}));
