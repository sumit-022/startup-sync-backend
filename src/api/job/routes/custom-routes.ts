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
    {
      method: "GET",
      path: "/jobs/stats",
      handler: "job.stats",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/jobs/stats/companies",
      handler: "job.statsByCompanies",
      config: {
        policies: [],
      },
    },
    {
      method: "PATCH",
      path: "/jobs/migrate-status",
      handler: "job.migrateStatus",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/job/:id/least-quotes",
      handler: "job.getLeastQuote",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/job/:id/send-rfq-mail",
      handler: "job.sendRFQMail",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/job/stats/employee",
      handler: "job.statsByEmployee",
      config: {
        policies: [],
      },
    },
  ],
};
