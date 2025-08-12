import env from "./env.js";
import * as prisma from "./generated/prisma/index.js";

const { PrismaClient } = prisma;

export const $db = new PrismaClient({
  errorFormat: env.NODE_ENV === "development" ? "pretty" : "colorless",
});
