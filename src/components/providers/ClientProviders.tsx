"use client";

import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function ClientProviders({
    children,
    googleClientId
}: {
    children: React.ReactNode;
    googleClientId?: string;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // To prevent hydration mismatch, we render the same structure on server and client
    // but we only activate the providers when we have the keys.
    // Actually, GoogleOAuthProvider needs a clientId.

    if (!googleClientId) {
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
