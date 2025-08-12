import { CookieOptions, Request, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { sign as _sign, verify as _verify, Algorithm } from "jsonwebtoken";
import ms from "ms";
import { Result, ResultAsync } from "neverthrow";
import { toError } from "../helpers";
import { ParamsDictionary } from "../middlewares/helpers";

type TJsonWebTokenStrategyOptions<TAudience> = {
  expiresIn: ms.StringValue;
  issuer: string;
  algo: Algorithm;
  audience: TAudience;
  PRIVATE_KEY: string;
  PUBLIC_KEY_ID: string;
};

function createJwtStrategy<TAudience extends [string, ...string[]]>(
  opts: TJsonWebTokenStrategyOptions<TAudience>,
) {
  const { algo, audience, expiresIn, issuer, PRIVATE_KEY, PUBLIC_KEY_ID } =
    opts;

  type TSignOptions = {
    userId: string;
    payload: Parameters<typeof _sign>[0];
    audience: typeof audience;
  };

  const sign = Result.fromThrowable((opts: TSignOptions) => {
    return _sign(opts.payload, PRIVATE_KEY, {
      issuer,
      expiresIn,
      algorithm: algo,
      subject: opts.userId,
      audience: opts.audience,
      keyid: PUBLIC_KEY_ID,
    });
  }, toError("Failed to sign jwt token"));

  const verify = Result.fromThrowable(
    (token: string) =>
      _verify(token, PRIVATE_KEY, {
        issuer,
        audience,
        algorithms: [algo],
      }),
    toError("Failed to verify jwt"),
  );

  return {
    sign,
    verify,
  };
}

type TAuthOptions<TAudience> = {
  strategy: "jwt";
  options: TJsonWebTokenStrategyOptions<TAudience>;
  cookies: Pick<CookieOptions, "httpOnly" | "secure" | "sameSite">;
  hooks: {
    /** this will be called on each signin request */
    onSignin: (
      req: Request,
    ) => ResultAsync<
      { userId: string; payload: string; audience: TAudience },
      Error
    >;
  };
};

function createAuth<TAudience extends [string, ...string[]]>(
  opts: TAuthOptions<TAudience>,
) {
  const { strategy, options, cookies, hooks } = opts;
  const { onSignin } = hooks;
  const jwt = createJwtStrategy(options);
  const AUTH_COOKIE_NAME = "auth_token";

  /** signin express handler */
  const handleSigin: RequestHandler<ParamsDictionary, unknown, unknown> = (
    req,
    res,
  ) => {
    onSignin(req).match(
      (opts) => {
        jwt.sign(opts).match(
          (token) => {
            res.cookie(AUTH_COOKIE_NAME, token, {
              maxAge: ms(options.expiresIn),
              priority: "high",
              path: "/",
              ...cookies,
            });
            return res.sendStatus(StatusCodes.OK);
          },
          () => res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR),
        );
      },
      () => res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR),
    );
  };

  /** signout express handler */
  const handleSignout: RequestHandler<ParamsDictionary, unknown, unknown> = (
    _,
    res,
  ) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
      ...cookies,
    });
    res.sendStatus(StatusCodes.OK);
  };

  const handleAuthParsingMiddleware = (): RequestHandler => {
    return async function (req, _, next) {
      req.$auth = {
        session: null,
      };

      const token = req.cookies[AUTH_COOKIE_NAME];
      if (strategy === "jwt" && token) {
        jwt.verify(token).map((t) => {
          if (typeof t !== "string" && t.sub !== undefined) {
            req.$auth = {
              session: {
                userId: t.sub,
              },
            };
          }
        });
      }

      next();
    };
  };

  type TAccess = "authenticated" | "public";
  const allow = (
    access: TAccess,
  ): RequestHandler<ParamsDictionary, unknown, unknown> => {
    return function middleware(req, res, next) {
      if (access === "authenticated" && !req.$auth?.session) {
        return res.sendStatus(StatusCodes.FORBIDDEN);
      }
      return next();
    };
  };

  return {
    handlers: {
      signin: handleSigin,
      signout: handleSignout,
    },
    middlewares: {
      auth: handleAuthParsingMiddleware,
      allow,
    },
  };
}

declare module "http" {
  interface IncomingMessage {
    $auth: {
      session: {
        userId: string;
      } | null;
    };
  }
}

export default createAuth;
