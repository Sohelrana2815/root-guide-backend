import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: "development" | "production";
  FRONTEND_URL: string;
  BCRYPT_SALT_ROUND: number;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DATABASE_URL",
    "NODE_ENV",
    "FRONTEND_URL",
    "BCRYPT_SALT_ROUND",
    "JWT_ACCESS_SECRET",
    "JWT_ACCESS_EXPIRES",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing require environment variable ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND),
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
  };
};

export const envVars = loadEnvVariables();
