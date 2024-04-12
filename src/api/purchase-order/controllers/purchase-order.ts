/**
 * purchase-order controller
 */

import { factories } from "@strapi/strapi";
import { getFormAttachments } from "../../../utils/form";

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
          populate: ["attachments"],
        }
      );

      return { ...purchaseOrder, vendorId, jobCode };
    },

    async stats(ctx) {
      const { n: nStr, jobType, status } = ctx.query;

      const jobFilters = [
        ["SPARES SUPPLY", "SERVICES"].findIndex((val) => val === jobType) > 0
          ? `j.type = '${jobType}'`
          : "",
        ["QUERYRECEIVED", "ORDERCONFIRMED"].findIndex((val) => val === status) >
        0
          ? `j.status = '${status}'`
          : "",
      ].filter((j) => !!j);

      const n = parseInt(nStr ?? "10") ?? 10;

      // Largest companies by number of jobs
      const knex = strapi.db.connection;

      // const { rows: companies } = await knex.raw(
      //   `SELECT tablename FROM pg_tables WHERE schemaname='public'`
      // );
      // const { rows: companies } = await knex.raw(`SELECT *
      //   FROM information_schema.columns
      //  WHERE table_schema = 'public'
      //    AND table_name   = 'purchase_orders'
      //      ;
      // `);

      const { rows: companies } = await knex.raw(
        `SELECT v.id, v.name, COUNT(DISTINCT j.id) AS num_jobs
FROM vendors v
JOIN purchase_orders_vendor_links povl ON v.id = povl.vendor_id
JOIN purchase_orders_job_links poj ON povl.purchase_order_id = poj.purchase_order_id
JOIN jobs j ON poj.job_id = j.id${
          jobFilters.length > 0 ? " AND " + jobFilters.join(" AND ") : ""
        }
JOIN purchase_orders p ON poj.purchase_order_id = p.id
GROUP BY v.id, v.name
ORDER BY num_jobs DESC
LIMIT ${n};
`
      );

      return {
        companies,
      };
    },
  })
);
