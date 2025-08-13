import { ResultAsync } from "neverthrow";
import { z } from "zod";
import pkg from "../package.json" with { type: "json" };
import env from "./env.js";
import createAuth from "./lib/auth.js";
import { Password } from "./password.js";
import { email, password } from "./schema/index.js";

const signInBodySchema = z.object({
  email,
  password,
});

const { handlers, middlewares } = createAuth({
  strategy: "jwt",
  options: {
    PRIVATE_KEY: env.AUTH_JWT_PRIVATE_KEY,
    PUBLIC_KEY_ID: env.AUTH_JWT_KEY_ID,
    algo: "HS256",
    audience: ["service:auth", "service:files"],
    issuer: pkg.name,
    expiresIn: "1h",
  },
  cookies: {
    secure: env.NODE_ENV === "production",
    httpOnly: env.NODE_ENV === "production",
    sameSite: "strict",
  },
  hooks: {
    onSignin: ResultAsync.fromThrowable(async (req) => {
      const { email, password } = await signInBodySchema.parseAsync(req.body);
      const user = await req.$db.client.user.findByEmail(email, true);

      if (!user) {
        throw Error("No user found");
      }

      const claimedPassword = (await Password.from(password))._unsafeUnwrap();
      const savedPassword = Password.fromHashedString(user.hashedPassword);
      (await claimedPassword.isEqual(savedPassword))._unsafeUnwrap();

      return {
        userId: user.id,
        audience: ["service:auth", "service:files"],
        payload: {},
      };
    }),
  },
});

export const { signin, signout } = handlers;
export const { allow, auth } = middlewares;
