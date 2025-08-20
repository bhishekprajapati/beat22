import app from "./app.js";
import env from "./env.js";
import { logger } from "./logger.js";

app.listen(env.SERVER_PORT, env.SERVER_ADDRESS, (error) => {
  if (error) {
    logger.error("Failed to start error!");
    logger.error(error);
    process.exit(1);
  }
  const on = `http://${env.SERVER_ADDRESS}:${env.SERVER_PORT}`;
  logger.info(`Server listening on ${on}`);
});
