/**
 * job controller
 */

import { factories } from "@strapi/strapi";
import fs from "fs";
import { matchBaseUrl } from "../../../utils/match";
import { encrypt } from "../../../utils/encode-decode";
import { getFormAttachments } from "../../../utils/form";
import { uploadAndLinkDocument } from "../../../utils/upload";
import { getRFQMailContent } from "../../../utils/main-content";

export default factories.createCoreController("api::job.job", ({ strapi }) => ({
  async create(ctx) {
    // Automatically generate the job code based on the last job code using the job service
    const jobCode = await strapi.service("api::job.job").generateJobCode();
    // Set the job code
    ctx.request.body.jobCode = jobCode;

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

    type Vendor = { id: number; attachment: string };

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

    const vendorAttachments = getFormAttachments(files, "vendorAttachments");
    const spareMedia = getFormAttachments(files, "spareAttachments");

    const buffers = Object.fromEntries(
      Object.entries(vendorAttachments).map(([name, file]) => [
        name,
        fs.readFileSync(file.path),
      ])
    );

    if (!id) return ctx.badRequest("Job id is required");

    // Get the job
    const job = await strapi.entityService.findOne("api::job.job", id);

    if (!job) return ctx.notFound("Job not found");

    if (job.purchaseStatus === "RFQSENT")
      return ctx.badRequest("RFQ form already generated");

    // Get the vendor emails
    const vendorMails = await strapi.entityService.findMany(
      "api::vendor.vendor",
      {
        filters: {
          id: { $in: vendors.map(({ id }) => id) },
        },
        fields: ["id", "email"],
      }
    );

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
            quantity: spareDetail.quantity,
            description: spareDetail.description,
          },
        })
      )
    );

    const unSettledSpares = spares.filter(
      ({ status }) => status === "rejected"
    );

    // Upload the media for each spare
    const spareMediaUploads = await Promise.allSettled(
      (spares as any)
        .map(({ status, value: spare }, idx: number) => {
          if (
            status === "rejected" ||
            !Array.isArray(spareDetails[idx].attachments)
          )
            return undefined;
          const media = spareDetails[idx].attachments
            .map((name: string) => spareMedia[name])
            .filter((x) => x !== undefined);
          if (media.length === 0) return undefined;

          return media.map(
            (m) =>
              new Promise((resolve, reject) => {
                uploadAndLinkDocument(fs.readFileSync(m.path), {
                  extension: m.name.split(".").pop(),
                  filename: m.name,
                  mimeType: m.type,
                  refId: spare.id,
                  ref: "api::spare.spare",
                  field: "attachments",
                })
                  .then(resolve)
                  .catch(reject);
              })
          );
        })
        .flat()
        .filter((x) => x !== undefined)
    );

    const unSettledSpareMediaUploads = spareMediaUploads.filter(
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
          spares
            .map(({ status, value: spareDetail }: any) =>
              status === "fulfilled"
                ? strapi.entityService.create("api::rfq.rfq", {
                    data: {
                      RFQNumber: rfqNumber,
                      spare: spareDetail.id,
                      quotedPrice: 0,
                      vendor: vendor.id,
                    },
                  })
                : undefined
            )
            .filter((x) => x !== undefined)
        )
        .filter((x) => x.length !== 0)
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
          html:
            getRFQMailContent({
              link: `${origin}/vendor/form/rfq/${encrypt(
                rfqNumber,
                ENCRYPTION_KEY
              )}/${encrypt(vendor.id.toString(), ENCRYPTION_KEY)}`,
              port: job.targetPort,
              eta: job.vesselETA
                ? new Date(job.vesselETA).toDateString()
                : undefined,
            }) + (ctx.request.body.mailFooter || ""),
          attachments: (() => {
            const attachment = vendors.find(
              (v) => v.id === vendor.id
            )?.attachment;
            if (!attachment || !vendorAttachments?.[attachment])
              return undefined;
            return [
              {
                filename: vendorAttachments[attachment].name,
                content: buffers[attachment],
              },
            ];
          })(),
        })
      )
    );

    const unSettledMails = mails.filter(({ status }) => status === "rejected");

    // Update the job status
    await strapi.entityService.update("api::job.job", job.id, {
      data: {
        id: job.id,
        purchaseStatus: "RFQSENT",
        RFQNumber: rfqNumber,
      },
    });

    return {
      spares,
      spareMediaUploads,
      rfqForms,
      mails,
      unSettledSpares,
      unSettledSpareMediaUploads,
      unSettledRFQForms,
      unSettledMails,
    };
  },
  async sendPO(ctx) {
    type Vendor = { id: number; attachment: string; body: string };

    const vendors = JSON.parse(ctx.request.body.vendors) as Vendor[];
    const files = ctx.request.files;

    // Get the vendor emails
    const vendorMails = await strapi.entityService.findMany(
      "api::vendor.vendor",
      {
        filters: {
          id: { $in: vendors.map(({ id }) => id) },
        },
        fields: ["id", "email"],
      }
    );

    if (!Array.isArray(vendorMails) || vendorMails.length !== vendors.length)
      return ctx.badRequest("Invalid vendor id");

    const vendorAttachments = getFormAttachments(files, "attachments");

    const buffers = Object.fromEntries(
      Object.entries(vendorAttachments).map(([name, file]) => [
        name,
        fs.readFileSync(file.path),
      ])
    );

    const mails = await Promise.allSettled(
      vendorMails.map((vendor) =>
        strapi.plugins["email"].services.email.send({
          to: (vendor as any).email,
          subject: "Purchase Order - Shinpo Engineering",
          html:
            vendors.find((v) => v.id === vendor.id)?.body +
            (ctx.request.body.mailFooter || ""),
          attachments: (() => {
            const attachment = vendors.find(
              (v) => v.id === vendor.id
            )?.attachment;
            if (!attachment || !vendorAttachments?.[attachment])
              return undefined;
            return [
              {
                filename: vendorAttachments[attachment].name,
                content: buffers[attachment],
              },
            ];
          })(),
        })
      )
    );

    return {
      mails,
    };
  },
}));
