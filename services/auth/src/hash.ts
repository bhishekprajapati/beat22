import { compare, genSalt, hash } from "bcrypt";
import { ResultAsync } from "neverthrow";
import { toError } from "./helpers";

const safeCompare = ResultAsync.fromThrowable(
  (plainText: string, hash: string) => compare(plainText, hash),
  toError("Failed to compare hash"),
);

export class Hash {
  constructor(readonly value: string) {}

  isEqual(plainValue: string): ResultAsync<boolean, Error> {
    return safeCompare(plainValue, this.value);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.toString();
  }

  static readonly from = ResultAsync.fromThrowable(
    async (value: string) => new Hash(await hash(value, await genSalt(10))),
    toError("Failed to generate hash"),
  );
}
