/**
 * rfq controller
 */

import { factories } from "@strapi/strapi";
import fs from "fs";

export default factories.createCoreController("api::rfq.rfq", ({ strapi }) => ({
  async sendRFQAck(ctx) {
    const { id } = ctx.params;
    const { vendorId, mailBody, subject } = ctx.request.body;
    const files = ctx.request.files;

    if (!vendorId) {
      return ctx.badRequest("Vendor ID is required");
    }

    const rfqs = await strapi.entityService.findMany("api::rfq.rfq", {
      filters: {
        RFQNumber: id,
        vendor: vendorId,
        filled: true,
      },
    });

    const vendor = await strapi.entityService.findOne(
      "api::vendor.vendor",
      vendorId
    );

    if (rfqs.length === 0 || !vendor) {
      return ctx.badRequest("Invalid body");
    }

    const attachment = files?.attachment;
    if (!attachment) {
      return ctx.badRequest("Attachment is required");
    }

    const buffer = fs.readFileSync(attachment.path);

    // Send a mail to the vendor
    await strapi.plugins["email"].services.email.send({
      to: vendor.email,
      cc: process.env["CC_EMAIL"] || undefined,
      subject: subject || "RFQ Acknowledgement",
      html: mailBody,
      attachments: [
        {
          filename: attachment.name,
          content: buffer,
        },
      ],
    });

    return {
      message: "RFQ Acknowledgement sent successfully",
    };
  },
}));
