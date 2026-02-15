"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ownerApi } from "@/lib/api";
import { User, SummaryData } from "@/lib/types";

interface AuthContextType {
    user: SummaryData | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
    token: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const refreshUser = async () => {
        try {
            let storedToken: string | null = null;
            if (typeof window !== 'undefined') {
                storedToken = localStorage.getItem("token");
                setToken(storedToken);
            }

            if (!storedToken) {
                setLoading(false);
                return;
            }

            const data = await ownerApi.getSummary();
            setUser(data);
        } catch (error) {
            console.error("Failed to load user", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, token }}>
            {children}
        </AuthContext.Provider>
    );
}
