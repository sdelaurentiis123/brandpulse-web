"use client";

import { createContext, useContext } from "react";

const EntityContext = createContext<string | null>(null);

export function EntityProvider({
  entity,
  children,
}: {
  entity: string | null;
  children: React.ReactNode;
}) {
  return (
    <EntityContext.Provider value={entity}>{children}</EntityContext.Provider>
  );
}

export function useSelectedEntity(): string | null {
  return useContext(EntityContext);
}
