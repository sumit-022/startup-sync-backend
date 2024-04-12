export default {
  routes: [
    {
      method: "POST",
      path: "/purchase-order/save",
      handler: "purchase-order.save",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/purchase-order/stats",
      handler: "purchase-order.stats",
      config: {
        policies: [],
      },
    },
  ],
};
