"use client";

import { createContext, ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MainContextProps {}

export const MainContext = createContext({} as MainContextProps);

export default function MainClientContainer({
  children,
}: {
  children: ReactNode;
}) {
  const MainContextValues = {};
  return <MainContext value={MainContextValues}>{children}</MainContext>;
}
