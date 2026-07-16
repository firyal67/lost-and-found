"use client";

import { useEffect } from "react";
import { store } from "@/store";
import { Provider, useDispatch } from "react-redux";
import { forceLogout, hydrateAuth } from "@/store/slices/authSlice";

function AppInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());

    const handleForceLogout = () => dispatch(forceLogout());
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, [dispatch]);

  return null;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AppInit />
      {children}
    </Provider>
  );
}