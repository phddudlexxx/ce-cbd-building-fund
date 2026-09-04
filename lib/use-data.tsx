"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Mutation, Store } from "@/lib/types";

type DataContextValue = {
  store: Store | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  mutate: (mutation: Mutation) => Promise<Store>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const res = await fetch("/api/data", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      setError("Could not load records.");
      setLoading(false);
      return;
    }
    setStore((await res.json()) as Store);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(async (mutation: Mutation) => {
    const res = await fetch("/api/data", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error || "Could not save");
    }
    const next = (await res.json()) as Store;
    setStore(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({ store, loading, error, reload, mutate }),
    [store, loading, error, reload, mutate],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
