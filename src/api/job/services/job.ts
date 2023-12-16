/**
 * job service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService("api::job.job", ({ strapi }) => ({
  async generateJobCode() {
    // GENERAL FORMAT :: YYYY-SE-NNN; eg: 2023-SE-001

    // Get the last job code
    const lastJob = await strapi.entityService.findMany("api::job.job", {
      sort: {
        jobCode: "desc",
      },
      limit: 1,
    });

    // Get the current year
    const currentYear = new Date().getFullYear();

    if (lastJob.length === 0) {
      return `${currentYear}-SE-001`;
    }
    console.log({ lastJob: lastJob });

    const jobCodeParts = lastJob[0].jobCode.split("-");

    if (jobCodeParts.length !== 3) {
      return `${currentYear}-SE-001`;
    }

    // Get the last job code year
    const lastJobYear = parseInt(jobCodeParts[0]);

    // Get the last job code serial number
    const lastJobSerialNumber = parseInt(jobCodeParts[2]);

    // Generate the new job code
    let newJobCode = "";

    if (currentYear > lastJobYear) {
      newJobCode = `${currentYear}-SE-001`;
    } else {
      newJobCode = `${currentYear}-SE-${(lastJobSerialNumber + 1)
        .toString()
        .padStart(3, "0")}`;
    }

    return newJobCode;
  },

  async parseCSV(file: any) {
    // Parse the CSV file
    const csv = await strapi.plugins["upload"].services.upload.parseCsv(file);

    // Convert the CSV to JSON
    const json = await strapi.plugins["upload"].services.upload.csvToJson(csv);

    // Return the parsed CSV
    return json;
  },
}));
