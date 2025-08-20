import Avatar from "boring-avatars";
import { Button, buttonVariants } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FileList from "@/components/files/file-list";
import { getSession } from "./auth";
import Link from "next/link";
import { SignoutButton } from "@/components/auth";

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
        <Dialog>
          <form>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload size={20} /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>File upload</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label className="">
                    <Input type="file" />
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
        <SignoutButton />
      </div>

      <FileList userId={session.userId} />
    </div>
  );
}
