import { ResultAsync } from "neverthrow";
import { Hash } from "./hash.js";
import { toError } from "./helpers.js";

export class Password {
  constructor(
    private readonly value: string,
    private readonly hash: Hash,
  ) {}

  isEqual(to: Password | Hash): ResultAsync<boolean, Error> {
    return to instanceof Password
      ? to.hash.isEqual(this.value)
      : to.isEqual(this.value);
  }

  toString(): string {
    return this.hash.toString();
  }

  toJSON(): string {
    return this.toString();
  }

  /** create new a password from a string value (plain text password) */
  static from(value: string): ResultAsync<Password, Error> {
    return Hash.from(value)
      .map((hash) => new Password(value, hash))
      .mapErr(toError("Failed to instantiate password"));
  }

  static fromHashedString(value: string) {
    return new Password("", new Hash(value));
  }
}
