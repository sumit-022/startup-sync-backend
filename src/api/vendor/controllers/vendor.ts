/**
 * vendor controller
 */

import { factories } from "@strapi/strapi";
import crypto from "crypto";
import { encodeToURL } from "../../../utils/encode-decode";

export default factories.createCoreController(
  "api::vendor.vendor",
  ({ strapi }) => ({
    // Creates a new generic temp. vendor with 'filled' as false and returns its id
    async generateVendorId(ctx) {
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

      return entry.hash;
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
  })
);
