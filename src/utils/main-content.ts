export function getRFQMailContent({
  link,
  port,
  eta,
}: {
  link: string;
  port: string;
  eta: Date;
}) {
  return `Dear Sir / Madam<br/>
Good day,<br/><br/>

Kindly note attached requisition, please advise best price and availability of the requested parts.<br/><br/>

Port: ${port}<br/>
ETA: ${eta.toISOString()}<br/><br/>

Please place your offer online on <a href="${link}">this link</a>.<br/>
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
