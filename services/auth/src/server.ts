import cookieParser from "cookie-parser";
import express from "express";
import { StatusCodes } from "http-status-codes";
import ms from "ms";
import { nanoid } from "nanoid";
import { pinoHttp } from "pino-http";
import { omit } from "remeda";
import z from "zod";

import { allow, auth, signin, signout } from "./auth.js";
import env from "./env.js";
import { logger } from "./logger.js";
import { prisma } from "./middlewares/prisma.js";
import zValidate from "./middlewares/z-validate.js";
import { Password } from "./password.js";
import { email, password } from "./schema/index.js";

logger.info("Initializing server...");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(prisma());
app.use(auth());

app.disable("x-powered-by");

{
  app.post(
    "/accounts",
    allow("public"),
    zValidate({
      body: {
        schema: z.object({
          name: z.string().trim().nonempty().max(24),
          email,
          password,
        }),
        onError(_, __, res) {
          res.status(400).send();
        },
      },
    }),
    async function register(req, res) {
      const { client } = req.$db;
      const { email, password: plainPassword, name } = req.body;
      const password = (await Password.from(plainPassword))._unsafeUnwrap();

      {
        const user = await client.user.findByEmail(email);
        if (user) {
          res.status(StatusCodes.CONFLICT);
          res.statusMessage = "Email already exists";
          res.send({});
          return;
        }
      }

      {
        const token = nanoid(36);

        const user = await client.user.create({
          data: {
            name,
            email,
            hashedPassword: password.toString(),
            isVerified: false,
            VerificationToken: {
              create: {
                token,
                expiresAt: new Date(Date.now() + ms("1h")),
              },
            },
          },
        });

        res.send(omit(user, ["hashedPassword"]));
      }
    },
  );
}

app.post("/signin", allow("public"), signin);
app.post("/signout", allow("authenticated"), signout);

app.listen(env.SERVER_PORT, env.SERVER_ADDRESS, (error) => {
  if (error) {
    logger.error("Failed to start error!");
    logger.error(error);
    process.exit(1);
  }
  const on = `http://${env.SERVER_ADDRESS}:${env.SERVER_PORT}`;
  logger.info(`Server listening on ${on}`);
});
