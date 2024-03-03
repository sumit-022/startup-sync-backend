/**
 * purchase-order controller
 */

import { factories } from "@strapi/strapi";
import { getFormAttachments } from "../../../utils/form";
import { uploadAndLinkDocument } from "../../../utils/upload";
import fs from "fs";

export default factories.createCoreController(
  "api::purchase-order.purchase-order",
  ({ strapi }) => ({
    async save(ctx) {
      const { vendorId, jobCode } = ctx.request.body;
      if (!vendorId || !jobCode) {
        return ctx.badRequest("Vendor and Job are required");
      }
      const files = ctx.request.files;
      const attachments = getFormAttachments(files, "attachments");
      if (Object.keys(attachments).length === 0) {
        return ctx.badRequest("Attachments are required");
      }

      const jobs = await strapi.entityService.findMany("api::job.job", {
        filters: { jobCode },
        limit: 1,
      });

      if (jobs.length === 0) {
        return ctx.badRequest("Job not found");
      }

      const purchaseOrder = await strapi.entityService.create(
        "api::purchase-order.purchase-order",
        {
          data: {
            vendor: vendorId,
            job: jobs[0].id,
          },
          files: {
            attachments: Object.values(attachments),
          },
        }
      );

      // Upload attachments and link them to the purchase order
      // const uploads = await Promise.allSettled(
      //   Object.entries(attachments).map(([fileName, file]) => {
      //     return new Promise((resolve, reject) => {
      //       uploadAndLinkDocument(fs.readFileSync(file.path), {
      //         extension: file.name.split(".").pop(),
      //         filename: file.name,
      //         mimeType: file.type,
      //         refId: purchaseOrder.id,
      //         ref: "api::spare.spare",
      //         field: "attachments",
      //       })
      //         .then(resolve)
      //         .catch(reject);
      //     });
      //   })
      // );
      return purchaseOrder;
    },
  })
);
