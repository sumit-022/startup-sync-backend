export default {
  routes: [
    {
      method: "POST",
      path: "/currency/get-conversion-rate",
      handler: "currency.getConversionRate",
      config: {
        policies: [],
      },
    },
    {
      method: "PATCH",
      path: "/currency/update",
      handler: "currency.update",
      config: {
        policies: [],
      },
    },
  ],
};
