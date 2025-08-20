import Avatar from "boring-avatars";
import { buttonVariants } from "@/components/ui/button";
import FileList from "@/components/files/file-list";
import { getSession } from "./auth";
import Link from "next/link";
import { SignoutButton } from "@/components/auth";
import { UploadForm } from "@/components/upload";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="p-40">
        <Link href="/auth/signin" className={buttonVariants({ size: "sm" })}>
          SignIn
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex gap-2 mb-4">
        <Avatar
          name={session.userId}
          size={24}
          colors={undefined as unknown as string[]}
        />
        <span className="ms-auto" />
        <UploadForm />
        <SignoutButton />
      </div>

      <FileList />
    </div>
  );
}
