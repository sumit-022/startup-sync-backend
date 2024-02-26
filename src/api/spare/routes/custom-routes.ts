export default {
  routes: [
    {
      method: "GET",
      path: "/spare/:id/attachments",
      handler: "spare.getAttachments",
      config: {
        policies: [],
      },
    },
  ],
};
