"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserContext } from "@/types";

interface HeaderProps {
  userContext: UserContext;
}

export function Header({ userContext }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome, {userContext.fullName}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 capitalize">
          {userContext.role}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
