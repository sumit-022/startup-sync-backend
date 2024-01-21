export default {
  routes: [
    {
      method: "POST",
      path: "/job/send-rfq",
      handler: "job.sendRFQForm",
      config: {
        policies: [],
      },
    },
  ],
};
