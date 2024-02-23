/**
 * rfq controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::rfq.rfq", ({ strapi }) => ({
  async sendRFQAck(ctx) {
    const { id } = ctx.params;
    const { vendorId, mailBody } = ctx.request.body;
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

    const attchment = files?.attachment;
    if (!attchment) {
      return ctx.badRequest("Attachment is required");
    }

    // Send a mail to the vendor
    await strapi.plugins["email"].services.email.send({
      to: vendor.email,
      subject: "RFQ Acknowledgement",
      html: mailBody,
      attachments: [
        {
          filename: attchment.name,
          content: attchment.data,
        },
      ],
    });

    return {
      message: "RFQ Acknowledgement sent successfully",
    };
  },
}));
