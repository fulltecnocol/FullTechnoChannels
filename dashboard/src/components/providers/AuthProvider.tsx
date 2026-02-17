"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface User {
    id: number;
    email: string;
    full_name?: string;
    is_owner: boolean;
    is_admin: boolean;
    referral_code?: string;
    telegram_id?: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            if (pathname !== "/login" && pathname !== "/register") {
                router.push("/login");
            }
            return;
        }

        try {
            const userData = await apiRequest<User>("/auth/me");
            setUser(userData);
        } catch (error) {
            // Token invalid
            localStorage.removeItem("token");
            setUser(null);
            if (pathname !== "/login" && pathname !== "/register") {
                router.push("/login"); // Redirect to login
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem("token", token);
        checkAuth();
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <AuthContext.Provider value={{ user, loading, login, logout }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
};

export const useAuth = () => useContext(AuthContext);
