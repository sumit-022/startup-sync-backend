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
    {
      method: "PUT",
      path: "/vendors/:hash",
      handler: "vendor.updateVendor",
      config: {
        policies: [],
      },
    },
  ],
};
