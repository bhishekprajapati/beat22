export const toError = (message: string) => {
  return function (e: unknown) {
    return e instanceof Error
      ? e
      : new Error(message, {
          cause: e,
        });
  };
};
