# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>

Start the containers using sudo docker compose up -d
Stop the containers using sudo docker compose down
Reset the containers using sudo docker compose up -d --force-recreate --build

TO UPDATE THE ENV UPDATE THE ENV IN ecosystem.config.js in ~

```js
module.exports = {
  apps: [
    {
      name: "shinpo-api", // Your project name
      cwd: "/home/ubuntu/shinpo-api", // Path to your project
      script: "yarn", // For this example we're using npm, could also be yarn
      args: "start", // Script to start the Strapi server, `start` by default
      env: {
        APP_KEYS:
          "M3e7u05/IMefzv8OHrtuvA==,gCPoHqPKwkujxwT/+CaU8A==,eYb6Lf4kHzSMczh4K8BgSw==,tbD+nsw+e4pQUwW99AOGQw==", // you can find it in your project .env file.
        API_TOKEN_SALT: "bxErfKTss5J0kPZ4bseJ2A==",
        ADMIN_JWT_SECRET: "BX4unGIwReTVKuR6tXRYGA==",
        JWT_SECRET: "jkvwkvbjkwrnbkjwnwjcndkndj",
        NODE_ENV: "production",
        // DATABASE_HOST: "strapidb.c4mqwarttn6j.ap-southeast-1.rds.amazonaws.com", // database Endpoint under 'Connectivity & Security' tab // Old
        DATABASE_HOST: "shinpodb.c4mqwarttn6j.ap-southeast-1.rds.amazonaws.com", // database Endpoint under 'Connectivity & Security' tab
        DATABASE_PORT: "5432",
        // DATABASE_NAME: "strapidb", // DB name under 'Configuration' tab // Old
        DATABASE_NAME: "shinpodb", // DB name under 'Configuration' tab
        DATABASE_USERNAME: "postgres", // default username
        DATABASE_PASSWORD: "shinpostrapi",
        AWS_ACCESS_KEY_ID: "AKIAV756F26WQVXJ5R5R",
        AWS_ACCESS_SECRET: "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", // Find it in Amazon S3 Dashboard
        AWS_REGION: "ap-southeast-1",
        AWS_BUCKET_NAME: "shinpo-bucket",
      },
    },
  ],
};
```

## Setting up RDS

1. identifier -> shinpodb
2. postgres shinpostrapi
3. connect to EC2 compute resource
4. Additional initial db name
5. Security groups -> Add default
6. -> Parameter groups
7. Make publicly accessible

```bash
cd ~/shinpo-api && git pull && NODE_ENV=production yarn && yarn build && cd ~ && pm2 startOrRestart ecosystem.config.js
```

```
upstream backend {
  server localhost:1337;
}

server {
  listen 80;

  server_name nav.shinpoengineering.com;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

```js
module.exports = {
  apps: [
    {
      env: {
        APP_KEYS="M3e7u05/IMefzv8OHrtuvA==,gCPoHqPKwkujxwT/+CaU8A==,eYb6Lf4kHzSMczh4K8BgSw==,tbD+nsw+e4pQUwW99AOGQw=="
        API_TOKEN_SALT="bxErfKTss5J0kPZ4bseJ2A=="
        ADMIN_JWT_SECRET="BX4unGIwReTVKuR6tXRYGA=="
        JWT_SECRET="jkvwkvbjkwrnbkjwnwjcndkndj"
        NODE_ENV="production"
        DATABASE_HOST="shinpodb.c4mqwarttn6j.ap-southeast-1.rds.amazonaws.com"
        DATABASE_PORT="5432"
        DATABASE_NAME="shinpodb"
        DATABASE_USERNAME="postgres"
        DATABASE_PASSWORD="shinpostrapi"
        AWS_ACCESS_KEY_ID="AKIAV756F26WQVXJ5R5R"
        AWS_ACCESS_SECRET="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"
        AWS_REGION="ap-southeast-1"
        AWS_BUCKET_NAME="shinpo-bucket"
        SMTP_HOST="smtp.office365.com"
        SMTP_PORT="587"
        SMTP_USERNAME="ranjan.tripathi@shinpoengineering.com"
        SMTP_PASSWORD="Shinpo@2023"
        ENCRYPTION_KEY="iwvebiwvbiuwbvuiwbbvjdsujdabsdvubrwu"
      },
    },
  ],
};
```
