import { cookies } from "next/headers";

export async function getSession() {
  const c = await cookies();
  const token = c.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const res = await fetch("http://auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const body = await res.json();
    console.log("auth body", body);

    if (typeof body === "object" && body !== null) {
      const { userId } = body;

      return {
        userId: userId as string,
      };
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}
