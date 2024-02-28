/**
 * vendor controller
 */

import { factories } from "@strapi/strapi";
import crypto from "crypto";
import { encodeToURL } from "../../../utils/encode-decode";
import { matchBaseUrl } from "../../../utils/match";

export default factories.createCoreController(
  "api::vendor.vendor",
  ({ strapi }) => ({
    // Creates a new generic temp. vendor with 'filled' as false and returns its id
    async generateVendorId(ctx) {
      const { email } = ctx.request.body;
      let origin = ctx.request.body.origin || ctx.request.headers.origin;

      origin = matchBaseUrl(origin);

      if (!email) {
        return ctx.badRequest("Email is required");
      }
      if (!origin || origin === false) {
        return ctx.badRequest("Invalid origin");
      }

      if (origin[origin.length - 1] === "/") {
        origin = origin.slice(0, -1);
      }

      const vendor = await strapi.entityService.create("api::vendor.vendor", {
        data: {
          filled: false,
        },
      });

      // Hash the vendor id and return it
      const hash = encodeToURL(
        crypto
          .createHash("sha256")
          .update(vendor.id.toString())
          .digest("base64")
      );

      // Update the vendor's hash with the generated hash
      const entry = await strapi.entityService.update(
        "api::vendor.vendor",
        vendor.id,
        {
          data: {
            id: vendor.id,
            hash: hash,
          },
        }
      );

      // Send the mail using node mailer
      await strapi.plugins["email"].services.email.send({
        to: email,
        subject: "Vendor Registration Form Link - Shinpo Engineering",
        html:
          `Dear Sir/Mam,<br/>I hope this email finds you well. <br/><br/>To streamline our supplier selection process and maintain up-to-date records, we have recently implemented a Supplier Registration Portal on our website. We kindly invite you to register your company's details on our portal using the following link.<br/>Click this link to register as a vendor: <a href="${
            origin + "/vendor/form/" + hash
          }">${origin}/vendor/form/${hash}</a> <br/><br/>Please ensure to complete all the required fields accurately, as this will enable us to review and evaluate your company as a potential partner for future collaboration. <br/><br/>Please note that registering on our Supplier Registration Portal will ensure that your company is included in our database for consideration as relevant projects or partnership opportunities arise.<br/><br/>We believe that establishing a strong network of trusted suppliers is essential for our mutual growth and success. We highly value the professional relationships we build and look forward to the possibility of collaborating with your esteemed company.<br/><br/>If you have any questions or encounter any issues during the registration process, please feel free to contact us.` +
          (ctx.request.body.mailFooter || ""),
      });

      return entry;
    },
    // Make sure that you don't give access to create a vendor to anyone but the admin
    async updateVendor(ctx) {
      const { hash } = ctx.params;

      // Search for the vendor with the given hash
      const vendor = await strapi.entityService.findMany("api::vendor.vendor", {
        filters: {
          hash,
          filled: false,
        },
        limit: 1,
        publicationState: "preview",
      });

      if (vendor.length === 0) {
        return ctx.badRequest("Invalid vendor hash");
      }

      // Update the vendor with the given hash
      const entry = await strapi.entityService.update(
        "api::vendor.vendor",
        vendor[0].id,
        {
          data: {
            ...ctx.request.body,
            filled: true,
            registered: true,
            // Publish the vendor
            publishedAt: new Date().getTime(),
          },
        }
      );

      return entry;
    },

    // Handler to check if a hash is valid and return the vendor
    async getVendor(ctx) {
      const { hash } = ctx.params;

      // Search for the vendor with the given hash
      const vendor = await strapi.entityService.findMany("api::vendor.vendor", {
        filters: {
          hash,
        },
        populate: "*",
        limit: 1,
      });

      if (vendor.length === 0) {
        return ctx.badRequest("Invalid vendor hash");
      }

      return vendor[0];
    },

    async manualEntry(ctx) {
      const vendor = await strapi.entityService.create("api::vendor.vendor", {
        data: {
          filled: false,
        },
      });

      // Hash the vendor id and return it
      const hash = encodeToURL(
        crypto
          .createHash("sha256")
          .update(vendor.id.toString())
          .digest("base64")
      );

      // Update the vendor's hash with the generated hash
      const entry = await strapi.entityService.update(
        "api::vendor.vendor",
        vendor.id,
        {
          data: {
            id: vendor.id,
            hash: hash,
          },
        }
      );

      return entry;
    },

    async markAsRegistered(ctx) {
      // Update all the vendors with email filled to be registered
      const { magicWord } = ctx.request.body;

      if (magicWord !== "pls update vendors") {
        return ctx.badRequest("Invalid magic word");
      }

      const updatedVendors = await strapi.db
        .query("api::vendor.vendor")
        .updateMany({
          where: {
            email: {
              $not: "",
            },
          },
          data: {
            registered: true,
          },
        });

      return updatedVendors;
    },
  })
);
