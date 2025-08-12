import { ResultAsync } from "neverthrow";
import { z } from "zod";
import pkg from "../package.json";
import env from "./env";
import createAuth from "./lib/auth";
import { Password } from "./password";
import { email, password } from "./schema";

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
    audience: ["service:auth", "service:upload"],
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
        audience: ["service:auth", "service:upload"],
        payload: JSON.stringify({}),
      };
    }),
  },
});

export const { signin, signout } = handlers;
export const { allow, auth } = middlewares;
