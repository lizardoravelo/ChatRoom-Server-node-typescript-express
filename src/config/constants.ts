import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const roles = ['user', 'admin'] as const;

type Role = (typeof roles)[number];

interface Config {
  port: string;
  app: string;
  env: string;
  secret: string;
  hostname: string;
  mongo: {
    uri: string;
    testURI: string;
  };
  transporter: {
    host: string;
    port: string;
    username: string;
    password: string;
  };
  roles: readonly Role[];
  messages_per_page: number;
  rooms_per_page: number;
}

const config: Config = {
  port: process.env.PORT ?? '',
  app: process.env.APP ?? '',
  env: process.env.NODE_ENV ?? '',
  secret: process.env.APP_SECRET ?? '',
  hostname: process.env.HOSTNAME ?? '',
  mongo: {
    uri: process.env.MONGODB_URL ?? '',
    testURI: process.env.MONGOTESTURI ?? '',
  },
  transporter: {
    host: process.env.TRANSPORTER_HOST ?? '',
    port: process.env.TRANSPORTER_PORT ?? '',
    username: process.env.TRANSPORTER_USERNAME ?? '',
    password: process.env.TRANSPORTER_PASSWORD ?? '',
  },
  roles,
  messages_per_page: Number(process.env.MESSAGE_PER_PAGE) ?? 50,
  rooms_per_page: Number(process.env.ROOMS_PER_PAGE) ?? 10,
};

export default config;
