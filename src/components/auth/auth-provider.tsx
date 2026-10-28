"use client";

import React, { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";

interface AuthContextType {
  data: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  error: ReturnType<typeof useSession>["error"];
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
