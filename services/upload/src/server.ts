import {
  CreateBucketCommand,
  HeadBucketCommand,
  NotFound,
} from "@aws-sdk/client-s3";
import express from "express";
import { pinoHttp } from "pino-http";
import env from "./env";
import { logger } from "./logger";
import { prisma } from "./middlewares/prisma";
import { s3 } from "./s3";

logger.info("Initializing server...");

const app = express();

app.use(
  express.raw({
    limit: env.S3_BUCKET_MAX_SIZE,
  }),
);
app.use(pinoHttp({ logger }));
app.use(prisma());
app.disable("x-powered-by");

async function bootstrap() {
  {
    const name = env.S3_BUCKET_NAME;
    try {
      logger.info("Checking s3 bucket...");
      await s3.send(
        new HeadBucketCommand({
          Bucket: name,
        }),
      );
      // TODO: add additional checks
      logger.warn("Skipping lock and permission check for this bucket");
      logger.info("Found the bucket");
    } catch (err) {
      if (err instanceof NotFound) {
        logger.error(`S3 bucket named "${name}" does not exists`);
        logger.info(`Creating S3 bucket by name ${name}`);
        try {
          await s3.send(new CreateBucketCommand({ Bucket: name }));
          logger.info(`Created new s3 bucket "${name}"`);
        } catch (err) {
          logger.error("Failed to create S3 bucket");
          logger.error(err);
          throw err;
        }
      }
    }
  }

  app.listen(env.SERVER_PORT, env.SERVER_ADDRESS, (error) => {
    if (error) {
      logger.error("Failed to start error!");
      logger.error(error);
      process.exit(1);
    }
    const on = `http://${env.SERVER_ADDRESS}:${env.SERVER_PORT}`;
    logger.info(`Server listening on ${on}`);
  });
}

bootstrap();
