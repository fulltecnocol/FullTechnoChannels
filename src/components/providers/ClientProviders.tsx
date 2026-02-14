"use client";

import React, { useSyncExternalStore } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientProviders({
    children,
    googleClientId
}: {
    children: React.ReactNode;
    googleClientId?: string;
}) {
    // Use useSyncExternalStore to avoid setState in effect warning
    // while still preventing hydration mismatches
    const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // To prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    if (!googleClientId) {
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
