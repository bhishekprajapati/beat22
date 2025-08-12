import express from "express";
import { pinoHttp } from "pino-http";
import env from "./env";
import { logger } from "./logger";
import { prisma } from "./middlewares/prisma";

logger.info("Initializing server...");

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(prisma());

app.disable("x-powered-by");

app.listen(env.SERVER_PORT, env.SERVER_ADDRESS, (error) => {
  if (error) {
    logger.error("Failed to start error!");
    logger.error(error);
    process.exit(1);
  }
  const on = `http://${env.SERVER_ADDRESS}:${env.SERVER_PORT}`;
  logger.info(`Server listening on ${on}`);
});
