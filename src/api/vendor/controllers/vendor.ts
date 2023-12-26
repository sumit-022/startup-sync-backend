/**
 * vendor controller
 */

import { factories } from "@strapi/strapi";

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

      return vendor.id;
    },
    // Make sure that you don't give access to create a vendor to anyone but the admin
  })
);
