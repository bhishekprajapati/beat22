import cookieParser from "cookie-parser";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express, { Express } from "express";
import { fileTypeFromBuffer } from "file-type";
import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";
import { pinoHttp } from "pino-http";
import z from "zod";
import env from "./env";
import { logger } from "./logger";
import { prisma } from "./middlewares/prisma";
import { s3 } from "./s3";
import { createAuth } from "./auth";

logger.info("Initializing server...");
const app: Express = express();

const { allow, auth } = createAuth({
  url: env.AUTH_SERVER_URL,
  jwtCookieName: "auth_token",
});

app.use(
  express.raw({
    limit: env.S3_BUCKET_MAX_SIZE,
  }),
);
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(prisma());
app.use(auth());
app.disable("x-powered-by");

const s3Key = () => nanoid(32);

const SUPPORTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "video/mp4",
]);

{
  const filenameSchema = z.string().trim().nonempty().min(1).max(255);

  app.post("/uploads", allow("authenticated"), async (req, res) => {
    const ownerId = req.$auth!.userId;
    let filename: string | undefined = undefined;

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

    if (!req.body) {
      res.status(StatusCodes.BAD_REQUEST);
      res.statusMessage = "No file was provided";
      return res.send();
    }

    const fileBuffer = req.body as Buffer;
    const key = s3Key();
    const type = await fileTypeFromBuffer(fileBuffer);

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
            size: fileBuffer.length,
            ext: type.ext,
            mime: type.mime,
          },
        });

        const command = new PutObjectCommand({
          Key: key,
          Body: fileBuffer,
          Bucket: env.S3_BUCKET_NAME,
          ContentLength: fileBuffer.length,
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

app.get("/", allow("authenticated"), async (req, res) => {
  const ownerId = req.$auth!.userId;

  const files = await req.$db.client.file.findMany({
    where: {
      ownerId,
    },
  });

  return res.status(StatusCodes.OK).json({
    files,
  });
});

app.get("/:id", allow("authenticated"), async (req, res) => {
  const ownerId = req.$auth!.userId;
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

export default app;
