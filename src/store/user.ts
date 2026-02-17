import { create } from "zustand";
import type { UserContext } from "@/types";

interface UserStore {
  user: UserContext | null;
  setUser: (user: UserContext) => void;
  hasPermission: (permission: string) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions.includes(permission) ?? false;
  },
}));
