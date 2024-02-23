export default {
  routes: [
    {
      method: "POST",
      path: "/rfq/:id/send-ack",
      handler: "rfq.sendRFQAck",
      config: {
        policies: [],
      },
    },
  ],
};
