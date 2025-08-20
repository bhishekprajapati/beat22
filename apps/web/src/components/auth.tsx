"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignoutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <Button variant="outline" size="icon">
        <LogOut size={20} />
      </Button>
    </form>
  );
}
