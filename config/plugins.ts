export default ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        s3Options: {
          accessKeyId: env("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_ACCESS_SECRET"),
          region: env("AWS_REGION"),
          baseUrl: `https://${env("AWS_BUCKET_NAME")}.s3.${env(
            "AWS_REGION"
          )}.amazonaws.com`,
          params: {
            Bucket: env("AWS_BUCKET_NAME"),
          },
        },
      },
      sizeLimit: 250 * 1024 * 1024, // 256mb in bytes
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp.gmail.com"),
        port: env("SMTP_PORT", 465),
        auth: {
          user: env("SMTP_USERNAME", "lcb2021016@iiitl.ac.in"),
          pass: env("SMTP_PASSWORD", "prik zmha ccog vduk"),
        },
        // ... any custom nodemailer options
      },
      settings: {
        defaultFrom: "lcb2021016@gmail.com",
        defaultReplyTo: "lcb2021016@iiitl.ac.in",
      },
    },
  },
});
