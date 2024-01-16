export default {
  routes: [
    {
      method: "POST",
      path: "/job/create-rfq",
      handler: "job.createRFQForm",
      config: {
        policies: [],
      },
    },
  ],
};
