import type { RequestHandler } from "express";
import { ResultAsync } from "neverthrow";
import { $db } from "../db.js";
import { toError } from "../helpers.js";
import type { ParamsDictionary } from "./helpers.js";

type TDatabaseClientState = ReturnType<typeof getDatabaseClientState>;
function getDatabaseClientState() {
  let isConnected = false;

  const connect = ResultAsync.fromThrowable(async () => {
    if (!isConnected) await $db.$connect();
    isConnected = true;
    return Promise.resolve();
  }, toError("Failed to connect to the mongo database"));

  const getIsConnected = () => isConnected;

  return {
    getIsConnected,
    connect,
    client: $db,
  };
}

export function prisma(): RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  unknown
> {
  const $db = getDatabaseClientState();
  return async function middleware(req, _, next) {
    req.$db = $db;
    next();
  };
}

declare module "http" {
  interface IncomingMessage {
    $db: TDatabaseClientState;
  }
}
