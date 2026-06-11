"use client";
import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  companies: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
});

export function useAuth() { return useContext(AuthContext); }
