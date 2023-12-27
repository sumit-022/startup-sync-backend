export default {
  routes: [
    {
      method: "POST",
      path: "/vendors/generate-vendor-id",
      handler: "vendor.generateVendorId",
      config: {
        policies: [],
      },
    },
  ],
};
