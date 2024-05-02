export const ORDERED_JOB_STATUS = [
  "QUERYRECEIVED",
  "QUOTEDTOCLIENT",
  "ORDERCONFIRMED",
  "PODAWAITED",
  "INVOICEAWAITED",
];

export const isOrderConfirmed = (jobStatus: string) =>
  ORDERED_JOB_STATUS.indexOf(jobStatus) >=
  ORDERED_JOB_STATUS.indexOf("ORDERCONFIRMED");

export const isQuoted = (jobStatus: string) =>
  ORDERED_JOB_STATUS.indexOf(jobStatus) >=
  ORDERED_JOB_STATUS.indexOf("QUOTEDTOCLIENT");

export const isQueryReceived = (jobStatus: string) =>
  ORDERED_JOB_STATUS.indexOf(jobStatus) >=
  ORDERED_JOB_STATUS.indexOf("QUERYRECEIVED");
