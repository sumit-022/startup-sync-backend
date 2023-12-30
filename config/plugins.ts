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
    },
  },
});
