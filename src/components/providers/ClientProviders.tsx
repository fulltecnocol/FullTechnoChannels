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
