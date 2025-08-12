import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ParamsDictionary } from "./helpers.js";
import { z, ZodError, ZodType } from "zod";

type TZValidateOptions<TBodySchema = ZodType> = {
  body: {
    schema: TBodySchema;
    /**
     * send error Response accordingly
     * the middleware will not call next()
     */
    onError: (error: ZodError, req: Request, res: Response) => any;
  };
};

function zValidate<TBodySchema extends ZodType>(
  options: TZValidateOptions<TBodySchema>,
): RequestHandler<ParamsDictionary, unknown, z.infer<TBodySchema>> {
  const { body: bodyConfig } = options;
  return async function validator(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const result = await bodyConfig.schema.safeParseAsync(req.body);
    if (!result.success) {
      return bodyConfig.onError(result.error, req, res);
    } else {
      req.body = result.data;
      next();
    }
  };
}

export default zValidate;
