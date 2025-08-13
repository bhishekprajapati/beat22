"use client";

type TSession =
  | {
      isLoaded: false;
    }
  | {
      isLoaded: true;
      session: { email: string; userId: string; name: string } | null;
    };

export default function useSession(): TSession {
  return {
    isLoaded: true,
    session: {
      email: "some@email.com",
      name: "John doe",
      userId: "cdsnbckds",
    },
  };
}
