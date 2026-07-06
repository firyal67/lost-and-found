"use client";

import { useEffect } from "react";
import { store } from "@/store";
import { Provider, useDispatch } from "react-redux";
import { forceLogout, hydrateAuth } from "@/store/slices/authSlice";

/**
 * AppInit : s'exécute une seule fois au montage.
 * - Hydrate l'état auth (vérifie si une session est active via cookie)
 * - Écoute l'event global "auth:logout" déclenché par api-client en cas de session expirée
 */
function AppInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Vérifier la session existante au démarrage
    dispatch(hydrateAuth());

    // Écouter les déconnexions forcées (refresh token expiré)
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
