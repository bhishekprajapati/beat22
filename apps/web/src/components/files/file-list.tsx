import { getSession } from "@/app/auth";
import { cookies } from "next/headers";

type TFile = {
  id: string;
  ext: string;
  mime: string;
  filename: string;
  size: number;
  ownerId: string;
  key: string;
  createdAt: string;
};

async function getUserFiles() {
  const session = await getSession();

  if (!session) {
    return {
      status: "unauthenticated" as const,
    };
  }

  try {
    const res = await fetch("http://files/", {
      headers: {
        "Content-Type": "application/json",
        cookie: (await cookies()).toString(),
      },
    });

    if (!res.ok) {
      return {
        status: "error" as const,
      };
    }

    const files = await res.json();
    return {
      status: "success" as const,
      data: files as Record<"files", Array<unknown>>,
    };
  } catch (err) {
    console.error(err);
    return {
      status: "error" as const,
    };
  }
}

export default async function FileList() {
  const result = await getUserFiles();

  if (result.status === "unauthenticated") {
    return <></>;
  }

  if (result.status === "error") {
    return <>an error occured...</>;
  }

  if (result.data.files.length === 0) {
    return <>no files found...</>;
  }

  const files = result.data.files as unknown as {
    id: string;
    filename: string;
  }[];
  return (
    <ul>
      {files.map((file) => (
        <li key={file.id}>
          <p>id: {file.id}</p>
          <p>name: {file.filename}</p>
        </li>
      ))}
    </ul>
  );
}
