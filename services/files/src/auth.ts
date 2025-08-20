import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { ParamsDictionary } from "./middlewares/helpers.js";

type TCreateAuthOptions = {
  url: string;
  jwtCookieName: string;
};

export function createAuth(options: TCreateAuthOptions) {
  const { url, jwtCookieName } = options;

  function auth(): RequestHandler<ParamsDictionary, unknown, unknown, unknown> {
    return async function middleware(req, res, next) {
      req.$auth = null;

      const cookies = req.cookies;
      const token =
        typeof cookies === "object" &&
        cookies !== null &&
        Object.hasOwn(cookies, jwtCookieName)
          ? (cookies[jwtCookieName] as unknown)
          : null;

      if (typeof token === "string" && token.length > 0) {
        try {
          const res = await fetch(`${url}/verify`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const session = await res.json();
            if (
              typeof session === "object" &&
              session !== null &&
              Object.hasOwn(session, "userId") &&
              typeof session["userId"] === "string" &&
              session["userId"].length > 0
            ) {
              req.$auth = {
                userId: session["userId"],
              };
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      next();
    };
  }

  type TAccess = "public" | "authenticated";

  function allow(
    access: TAccess,
  ): RequestHandler<ParamsDictionary, unknown, unknown, unknown> {
    return async function middleware(req, res, next) {
      if (access === "authenticated" && !req.$auth) {
        return res.status(StatusCodes.UNAUTHORIZED).send();
      }

      return next();
    };
  }

  return {
    auth,
    allow,
  };
}

type TSession = { userId: string };

declare module "http" {
  interface IncomingMessage {
    $auth: TSession | null;
  }
}
