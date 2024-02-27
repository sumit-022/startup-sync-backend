/**
 * currency controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::currency.currency",
  ({ strapi }) => ({
    async getConversionRate(ctx: any) {
      const { code } = ctx.request.body;
      // Check if the data for the currency code exists
      const currency = await strapi.entityService.findMany(
        "api::currency.currency",
        {
          filters: {
            code: code,
          },
          limit: 1,
        }
      );

      if (!Array.isArray(currency) || currency.length === 0) {
        return ctx.notFound("Currency not found");
      }

      // Return the conversion rate
      return currency[0];
    },

    async update(ctx) {
      const body = ctx.request.body;

      // Check if the body contains an array of currencies
      const updateRequest = Array.isArray(body) ? body : ([body] as any[]);

      // Update the currencies
      const updated = await Promise.allSettled(
        updateRequest.map((currency) => {
          if (currency.code && currency.rate) {
            const updatedCurrency = strapi.db
              .query("api::currency.currency")
              .update({
                where: { code: currency.code },
                data: {
                  rate: currency.rate,
                },
              });
            return updatedCurrency;
          } else {
            return Promise.reject(new Error("Invalid currency data"));
          }
        })
      );

      const created = await Promise.allSettled(
        updated
          .map((update, index) => {
            if (update.status === "fulfilled" && update.value === null) {
              return strapi.db.query("api::currency.currency").create({
                data: updateRequest[index],
              });
            } else {
              return null;
            }
          })
          .filter((currency) => currency !== null)
      );

      return [
        ...updated
          .map((update, idx) => {
            if (update.status === "fulfilled") {
              if (update.value !== null) return { updated: update.value };
            } else {
              return {
                code: updateRequest[idx].code,
                error: update.reason.message,
              };
            }
          })
          .filter((up) => up !== null),
        ...created.map((create) => {
          if (create.status === "fulfilled") {
            return { created: create.value };
          } else {
            return {
              error: create.reason.message,
            };
          }
        }),
      ].filter((currency) => currency !== null);
    },
  })
);
