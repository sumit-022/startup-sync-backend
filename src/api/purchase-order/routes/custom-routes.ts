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
  ],
};
