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
    {
      method: "POST",
      path: "/job/send-po",
      handler: "job.sendPO",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/job/publish-all",
      handler: "job.publishAll",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/job/notify-vendors",
      handler: "job.notifyVendors",
      config: {
        policies: [],
      },
    },
  ],
};
