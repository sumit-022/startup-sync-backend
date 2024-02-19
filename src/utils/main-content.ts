export function getRFQMailContent({ link }: { link: string }) {
  return `Dear Sir / Madam
Good day,

Kindly note attached requisition, please advise best price and availability of the requested parts.

Port: Singapore
ETA: 16th Feb 2024

Please place your offer online at <a href="${link}">${link}</a>
In case you are not able to open above link, please find attached RFQ in PDF format, kindly quote accordingly.
We are looking forward to your offer and like to thank you for your assistance.`;
}

export function getMailFooter({
  coordinatorName,
}: {
  coordinatorName: string;
}) {
  return `Best Regards,
${coordinatorName}
`;
}
