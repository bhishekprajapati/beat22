import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  SERVER_ADDRESS: z.string().trim().nonempty().default("127.0.0.1"),
  SERVER_PORT: z.coerce.number().int().gt(0).lte(65535).default(8080),
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  AUTH_JWT_KEY_ID: z.string().trim().nonempty(),
  AUTH_JWT_PRIVATE_KEY: z.string().trim().nonempty(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

const env = result.data;
export default env;
