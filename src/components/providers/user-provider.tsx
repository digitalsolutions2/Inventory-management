"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user";
import type { UserContext } from "@/types";

export function UserProvider({
  userContext,
  children,
}: {
  userContext: UserContext;
  children: React.ReactNode;
}) {
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    setUser(userContext);
  }, [userContext, setUser]);

  return <>{children}</>;
}
