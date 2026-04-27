/**
 * @file LoaderContext.tsx
 * @description Context provider and hook for managing application and page loaders.
 */
"use client";

import React, { createContext, useContext, useState } from "react";

interface LoaderState {
  appLoading: boolean;
  pageLoading: boolean;
  showAppLoader: () => void;
  hideAppLoader: () => void;
  showPageLoader: () => void;
  hidePageLoader: () => void;
}

const LoaderContext = createContext<LoaderState | undefined>(undefined);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [appLoading, setAppLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  const showAppLoader = () => setAppLoading(true);
  const hideAppLoader = () => setAppLoading(false);
  const showPageLoader = () => setPageLoading(true);
  const hidePageLoader = () => setPageLoading(false);

  return (
    <LoaderContext.Provider
      value={{
        appLoading,
        pageLoading,
        showAppLoader,
        hideAppLoader,
        showPageLoader,
        hidePageLoader,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
}
