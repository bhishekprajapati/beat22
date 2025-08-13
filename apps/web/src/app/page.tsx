"use client";

import Avatar from "boring-avatars";
import useSession from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";
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

export default function Home() {
  const session = useSession();

  if (!session.isLoaded) {
    return <>loading...</>;
  }

  if (!session.session) {
    return <>please signin</>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex gap-2 mb-4">
        <Avatar
          name={session.session.name}
          size={24}
          colors={undefined as unknown as string[]}
        />
        <span>{session.session.name}</span>
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
        <Button variant="outline" size="icon">
          <LogOut size={20} />
        </Button>
      </div>

      <FileList userId={session.session.userId} />
    </div>
  );
}
