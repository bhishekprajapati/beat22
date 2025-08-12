import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NotFound,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";
import { fileTypeFromBuffer } from "file-type";
import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";
import { pinoHttp } from "pino-http";
import z from "zod";
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

/** generate unique s3 key */
const s3Key = () => nanoid(32);
const userIdSchema = z.string().trim().nonempty();
const SUPPORTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "video/mp4",
]);

{
  const filenameSchema = z.string().trim().nonempty().min(1).max(255);

  app.post("/uploads", async (req, res) => {
    let filename: string | undefined = undefined;
    let ownerId: string | undefined = undefined;

    {
      const result = await filenameSchema.safeParseAsync(
        req.headers["x-filename"],
      );

      if (!result.success) {
        res.status(StatusCodes.BAD_REQUEST);
        res.statusMessage = "Invalid filename";
        return res.send();
      }

      filename = result.data;
    }

    {
      const result = await userIdSchema.safeParseAsync(req.headers["x-uid"]);

      if (!result.success) {
        logger.error("Missing 'x-uid' header in the request");
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        res.statusMessage = "Something went wrong";
        return res.send();
      }

      ownerId = result.data;
    }

    const key = s3Key();
    const type = await fileTypeFromBuffer(req.body);

    if (!type || !SUPPORTED_MIME_TYPES.has(type.mime)) {
      const message = "mime type not supported";
      res.status(StatusCodes.BAD_REQUEST);
      res.statusMessage = message;
      return res.send();
    }

    try {
      const file = await req.$db.client.$transaction(async (tx) => {
        const metadata = await tx.file.create({
          data: {
            key,
            ownerId,
            filename,
            size: req.body.length,
            ext: type.ext,
            mime: type.mime,
          },
        });

        const command = new PutObjectCommand({
          Key: key,
          Body: req.body,
          Bucket: env.S3_BUCKET_NAME,
          ContentLength: req.body.length,
          ContentType: type.mime,
          Metadata: {
            id: metadata.id,
          },
        });

        await s3.send(command);
        return metadata;
      });

      return res.status(StatusCodes.OK).json(file);
    } catch (err) {
      logger.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      res.statusMessage = "Failed to upload the file";
      return res.send();
    }
  });
}

app.get("/mimes", (_, res) => {
  res.status(StatusCodes.OK).send({
    mimes: Array.from(SUPPORTED_MIME_TYPES),
  });
});

app.get("/", async (req, res) => {
  const result = await userIdSchema.safeParseAsync(req.headers["x-uid"]);

  if (!result.success) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.statusMessage = "Failed to retrieve user id";
    return res.send();
  }

  const ownerId = result.data;

  const files = await req.$db.client.file.findMany({
    where: {
      ownerId,
    },
    omit: {
      ownerId: true,
    },
  });

  return res.status(StatusCodes.OK).json({
    files,
  });
});

app.get("/:id", async (req, res) => {
  const result = await userIdSchema.safeParseAsync(req.headers["x-uid"]);

  if (!result.success) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.statusMessage = "Failed to retrieve user id";
    return res.send();
  }

  const ownerId = result.data;
  const fileId = req.params["id"];

  const file = await req.$db.client.file.findUnique({
    where: {
      id: fileId,
      ownerId,
    },
  });

  if (!file) {
    res.status(StatusCodes.NOT_FOUND);
    res.statusMessage = "File not found";
    return res.send();
  }

  // FIX: sign for localhost not service name
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: file.key,
    }),
    {
      expiresIn: 60 * 60,
    },
  );

  return res.json({ url });
});

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
