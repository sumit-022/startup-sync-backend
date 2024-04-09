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
import { getWeek } from "../../../utils/date";
import { ORDERED_JOB_STATUS, isOrderConfirmed } from "../../../utils/jobStatus";

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
    const vendors = JSON.parse(ctx.request.body.vendors) as Vendor[];
    const files = ctx.request.files;

    let origin = ctx.request.body.origin || ctx.request.headers.origin;

    origin = matchBaseUrl(origin);
    if (!origin || origin === false) {
      return ctx.badRequest("Invalid origin");
    }

    const vendorAttachments = getFormAttachments(files, "vendorAttachments");

    const buffers = Object.fromEntries(
      Object.entries(vendorAttachments).map(([name, file]) => [
        name,
        fs.readFileSync(file.path),
      ])
    );

    if (!id) return ctx.badRequest("Job id is required");

    // Get the job
    const job = await strapi.entityService.findOne("api::job.job", id, {
      populate: ["spares", "spares.attachments"],
    });

    if (!job) return ctx.notFound("Job not found");

    // Check if the rfq is already generated for the vendors

    const rfqs = await strapi.entityService.findMany("api::rfq.rfq", {
      filters: {
        RFQNumber: `RFQ-${job.jobCode}`,
        vendor: vendors.map(({ id }) => id),
      },
    });

    if (rfqs.length !== 0) {
      return ctx.badRequest("RFQ already sent to the vendors");
    }

    // Get the vendor emails
    const vendorMails = await strapi.entityService.findMany(
      "api::vendor.vendor",
      {
        filters: {
          id: { $in: vendors.map(({ id }) => id) },
        },
        fields: ["id", "email"],
        populate: ["salescontact"],
      }
    );

    if (!Array.isArray(vendorMails) || vendorMails.length !== vendors.length)
      return ctx.badRequest("Invalid vendor id");

    if (job.purchaseStatus !== "RFQSENT") {
      const spareDetails = JSON.parse(ctx.request.body.spareDetails) as any[];
      const spareMedia = getFormAttachments(files, "spareAttachments");
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
                  const filename = m.name.split(".");
                  filename.pop();
                  const extension = m.name.split(".").pop();
                  uploadAndLinkDocument(fs.readFileSync(m.path), {
                    extension,
                    filename: filename.join(""),
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
      // Upload the media for each spare
      const spareMediaAttachments = (spares as any)
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

          return media.map((m, idx) => {
            const fileName = m.name.split(".");
            const ext = fileName.pop();
            return {
              filename: `spare-${fileName.join("")}-${idx + 1}.${ext}`,
              content: fs.readFileSync(m.path),
            };
          });
        })
        .flat()
        .filter((x) => x !== undefined);

      const mails = await Promise.allSettled(
        vendorMails.map((vendor) =>
          strapi.plugins["email"].services.email.send({
            to: (vendor as any).email,
            cc: (() => {
              const cc = [
                process.env["CC_EMAIL"],
                vendor.salescontact?.mail,
                ...JSON.parse(vendor.salescontact?.secondarymails || "[]"),
              ].filter((mail) => typeof mail === "string");
              if (cc.length === 0) return undefined;
              return cc;
            })(),
            subject: `${rfqNumber} - ${job.description || ""}`,
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
                ...spareMediaAttachments,
              ];
            })(),
          })
        )
      );

      const unSettledMails = mails.filter(
        ({ status }) => status === "rejected"
      );

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
    } else {
      // Generate the RFQ number
      const rfqNumber = strapi
        .service("api::job.job")
        .generateRFQNumber(job.jobCode);

      const spares = job.spares;

      // Generate a draft RFQ form for each vendor and each spare
      const rfqForms = await Promise.allSettled(
        vendors
          .map((vendor) =>
            spares
              .map((spareDetail) =>
                strapi.entityService.create("api::rfq.rfq", {
                  data: {
                    RFQNumber: rfqNumber,
                    spare: spareDetail.id,
                    quotedPrice: 0,
                    vendor: vendor.id,
                  },
                })
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

      const spareMediaAttachments = (spares as any)
        .map((spare) => {
          if (!Array.isArray(spare.attachments)) return undefined;
          const media = spare.attachments;

          return media.map((m, idx) => ({
            filename: `spare-${m.name}-${idx + 1}.${m.ext}`,
            content: m.url,
          }));
        })
        .flat()
        .filter((x) => x !== undefined);

      // Send mails to every vendor
      const mails = await Promise.allSettled(
        vendorMails.map((vendor) =>
          strapi.plugins["email"].services.email.send({
            to: (vendor as any).email,
            cc: (() => {
              const cc = [
                process.env["CC_EMAIL"],
                vendor.salescontact?.mail,
                ...JSON.parse(vendor.salescontact?.secondarymails || "[]"),
              ].filter((mail) => typeof mail === "string");
              if (cc.length === 0) return undefined;
              return cc;
            })(),
            subject: `${rfqNumber} - ${job.description || ""}`,
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
                ...spareMediaAttachments,
              ];
            })(),
          })
        )
      );

      const unSettledMails = mails.filter(
        ({ status }) => status === "rejected"
      );

      // Update the job status
      await strapi.entityService.update("api::job.job", job.id, {
        data: {
          id: job.id,
          purchaseStatus: "RFQSENT",
          RFQNumber: rfqNumber,
        },
      });

      return {
        rfqForms,
        mails,
        unSettledRFQForms,
        unSettledMails,
      };
    }
  },
  async sendPO(ctx) {
    type Vendor = {
      id: number;
      attachment: string;
      body: string;
      subject: string;
    };

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
        populate: ["salescontact"],
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
          cc: (() => {
            const cc = [
              process.env["CC_EMAIL"],
              vendor.salescontact?.mail,
              ...JSON.parse(vendor.salescontact?.secondarymails || "[]"),
            ].filter((mail) => typeof mail === "string");
            if (cc.length === 0) return undefined;
            return cc;
          })(),
          subject:
            vendors.find((v) => v.id === vendor.id)?.subject ||
            "Purchase Order - Shinpo Engineering",
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

  async publishAll(ctx) {
    // Check for the magic word
    const { magicWord } = ctx.request.body;
    if (magicWord !== "pls publish all")
      return ctx.badRequest("Invalid magic word");

    const names = ctx.request.body.names || [];

    if (!Array.isArray(names)) return ctx.badRequest("Invalid names array");

    // Publish all the drafts :D
    async function bulkPublishAll() {
      return await Promise.allSettled(
        names.map((name) =>
          strapi.db.query(`api::${name}.${name}`).updateMany({
            where: {
              publishedAt: null,
            },
            data: {
              publishedAt: new Date().toISOString(),
            },
          })
        )
      );
    }

    const publishState = await bulkPublishAll();

    return {
      message: "Published all drafts",
      publishState,
    };
  },

  async notifyVendors(ctx) {
    const bodies: {
      [id: string]: {
        subject: string;
        body: string;
      };
    } = ctx.request.body.bodies;

    const ids = Object.keys(bodies).map((id) => parseInt(id));

    for (const id in bodies) {
      if (
        typeof bodies[id].subject !== "string" ||
        typeof bodies[id].body !== "string"
      )
        return ctx.badRequest("Invalid body format");
    }

    // Fetch the vendors
    const vendors = await strapi.entityService.findMany("api::vendor.vendor", {
      filters: {
        id: { $in: ids },
      },
      fields: ["id", "email"],
      populate: ["salescontact"],
    });

    // Send mails to every vendor
    const mails = await Promise.allSettled(
      vendors.map((vendor) =>
        strapi.plugins["email"].services.email.send({
          to: vendor.email,
          cc: (() => {
            const cc = [
              process.env["CC_EMAIL"],
              vendor.salescontact?.mail,
              ...JSON.parse(vendor.salescontact?.secondarymails || "[]"),
            ].filter((mail) => typeof mail === "string");
            if (cc.length === 0) return undefined;
            return cc;
          })(),
          subject: bodies[vendor.id].subject,
          html: bodies[vendor.id].body,
        })
      )
    );

    return {
      mails,
    };
  },

  async stats(ctx) {
    const { startDate, endDate, aggregate, userId } = ctx.query;

    const agg = aggregate
      ? (aggregate as "day" | "week" | "month" | "year" | "total")
      : "total";

    const assignedTo = userId ? parseInt(userId) : undefined;

    if (!startDate || !endDate)
      return ctx.badRequest("Start date and end date are required");

    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
    } catch (err) {
      return ctx.badRequest("Invalid date format");
    }

    const filters = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (assignedTo) filters["assignedTo"] = assignedTo;

    // Divide the data into days, weeks, months or years
    if (agg === "total") {
      // Get the number of jobs created between the start and end date
      const jobsCreated = await strapi.entityService.count("api::job.job", {
        filters,
      });

      // Get the number of jobs with ORDERCONFIRMED status
      const jobsConfirmed = await strapi.entityService.count("api::job.job", {
        filters: {
          status: {
            $in: ORDERED_JOB_STATUS.slice(
              ORDERED_JOB_STATUS.indexOf("ORDERCONFIRMED")
            ),
          },
          ...filters,
        },
      });

      // Get the number of jobs with QUOTEDTOCLIENT status
      const jobsQuotedToClient = await strapi.entityService.count(
        "api::job.job",
        {
          filters: {
            status: "QUOTEDTOCLIENT",
            ...filters,
          },
        }
      );
      return {
        created: jobsCreated,
        confirmed: jobsConfirmed,
        quoted: jobsQuotedToClient,
      };
    } else {
      const jobs = await strapi.db.query("api::job.job").findMany({
        where: filters,
        select: ["createdAt", "status"],
      });

      if (agg === "day") {
        const data = jobs.reduce((acc, job) => {
          const date = new Date(job.createdAt).toDateString();
          if (!acc[date]) acc[date] = { created: 0, confirmed: 0, quoted: 0 };
          acc[date].created += 1;
          if (isOrderConfirmed(job.status)) acc[date].confirmed += 1;
          if (job.status === "QUOTEDTOCLIENT") acc[date].quoted += 1;
          return acc;
        }, {} as Record<string, { created: number; confirmed: number; quoted: number }>);

        return { type: agg, aggregate: data };
      }

      if (agg === "week") {
        const data = jobs.reduce((acc, job) => {
          const date = new Date(job.createdAt);
          const week = getWeek(date);
          if (!acc[week]) acc[week] = { created: 0, confirmed: 0, quoted: 0 };
          acc[week].created += 1;
          if (isOrderConfirmed(job.status)) acc[week].confirmed += 1;
          if (job.status === "QUOTEDTOCLIENT") acc[week].quoted += 1;
          return acc;
        }, {} as Record<number, { created: number; confirmed: number; quoted: number }>);

        return { type: agg, aggregate: data };
      }

      if (agg === "month") {
        const data = jobs.reduce((acc, job) => {
          const date = new Date(job.createdAt);
          const month = date.getMonth();
          if (!acc[month]) acc[month] = { created: 0, confirmed: 0, quoted: 0 };
          acc[month].created += 1;
          if (isOrderConfirmed(job.status)) acc[month].confirmed += 1;
          if (job.status === "QUOTEDTOCLIENT") acc[month].quoted += 1;
          return acc;
        }, {} as Record<number, { created: number; confirmed: number; quoted: number }>);

        return { type: agg, aggregate: data };
      }

      if (agg === "year") {
        const data = jobs.reduce((acc, job) => {
          const date = new Date(job.createdAt);
          const year = date.getFullYear();
          if (!acc[year]) acc[year] = { created: 0, confirmed: 0, quoted: 0 };
          acc[year].created += 1;
          if (isOrderConfirmed(job.status)) acc[year].confirmed += 1;
          if (job.status === "QUOTEDTOCLIENT") acc[year].quoted += 1;
          return acc;
        }, {} as Record<number, { created: number; confirmed: number; quoted: number }>);

        return { type: agg, aggregate: data };
      }

      return ctx.badRequest("Invalid aggregate");
    }
  },

  async statsByCompanies(ctx) {
    const { n: nStr } = ctx.query;

    const n = parseInt(nStr ?? "10") ?? 10;

    // Largest companies by number of jobs
    const knex = strapi.db.connection;

    const { rows: companies } =
      await knex.raw(`SELECT companies.id, companies.name, COUNT(jobs.id) AS job_count
FROM companies
JOIN jobs_company_links ON companies.id = jobs_company_links.company_id
JOIN jobs ON jobs_company_links.job_id = jobs.id
GROUP BY companies.id, companies.name
ORDER BY job_count DESC
LIMIT ${n};
`);

    return {
      companies,
    };
  },

  async migrateStatus(ctx) {
    // Check for the magic word
    const { magicWord } = ctx.request.body;
    if (magicWord !== "pls migrate status") {
      return ctx.badRequest("Invalid magic word");
    }

    const cancelledJobs = await strapi.entityService.findMany("api::job.job", {
      filters: {
        status: "JOBCANCELLED",
      },
    });

    const migratedCancelledJobs = await Promise.allSettled(
      cancelledJobs.map((job) =>
        strapi.entityService.update("api::job.job", job.id, {
          data: {
            id: job.id,
            status: "QUERYRECEIVED",
            jobClosedStatus: "JOBCANCELLED",
          },
        })
      )
    );

    // Marked as completed
    const jobsMarkedAsCompleted = await strapi.entityService.findMany(
      "api::job.job",
      {
        filters: {
          status: "JOBCOMPLETED",
        },
      }
    );

    const migratedJobsMarkedAsCompleted = await Promise.allSettled(
      jobsMarkedAsCompleted.map((job) =>
        strapi.entityService.update("api::job.job", job.id, {
          data: {
            id: job.id,
            status: "INVOICEAWAITED",
          },
        })
      )
    );

    // Get all the completed jobs
    const completedJobs = await strapi.entityService.findMany("api::job.job", {
      filters: {
        jobCompleted: true,
      },
    });

    const migratedCompletedJobs = await Promise.allSettled(
      completedJobs.map((job) =>
        strapi.entityService.update("api::job.job", job.id, {
          data: {
            id: job.id,
            jobClosedStatus: "JOBCOMPLETED",
          },
        })
      )
    );

    return {
      migratedCompletedJobs,
      migratedCancelledJobs,
      migratedJobsMarkedAsCompleted,
    };
  },
}));
