import { HeadBucketCommand, S3Client, NotFound } from "@aws-sdk/client-s3";
import env from "./env";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_CRED_ACCESS_KEY_ID,
    secretAccessKey: env.S3_CRED_SECRET_ACCESS_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});
