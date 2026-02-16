"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useSyncExternalStore, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/components/providers/AuthProvider";

const subscribe = () => () => { };
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

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    }));

    // To prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    if (!googleClientId) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
}
