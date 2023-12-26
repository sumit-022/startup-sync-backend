export default {
  routes: [
    {
      method: "POST",
      path: "/generate-vendor-id",
      handler: "vendor.generateVendorId",
      config: {
        policies: [],
      },
    },
  ],
};
