export default {
  routes: [
    {
      method: "POST",
      path: "/vendors/form/generate-vendor-id",
      handler: "vendor.generateVendorId",
      config: {
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/vendors/form/:hash",
      handler: "vendor.updateVendor",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/vendors/form/:hash",
      handler: "vendor.getVendor",
      config: {
        policies: [],
      },
    },
  ],
};
