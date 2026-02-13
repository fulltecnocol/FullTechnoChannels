"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ email: "", password: "" });

    React.useEffect(() => {
        setMounted(true);
        const query = new URLSearchParams(window.location.search);
        const magicToken = query.get("magic_token");

        if (magicToken && !loading) {
            setLoading(true);
            authApi.magicLogin(magicToken)
                .then((data: AuthResponse) => {
                    if (data && data.access_token) {
                        localStorage.setItem("token", data.access_token);
                        window.location.href = "/dashboard";
                    } else {
                        throw new Error("Token no recibido");
                    }
                })
                .catch((err: any) => {
                    console.error("Magic login error:", err);
                    setError("Enlace de acceso inválido o expirado.");
                    setLoading(false);
                });
        }
    }, [loading]);

    if (!mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await authApi.login(formData);
            localStorage.setItem("token", data.access_token);
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message || "Email o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError("");
        try {
            const data = await authApi.googleAuth(credentialResponse.credential);
            localStorage.setItem("token", data.access_token);
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message || "Error al autenticar con Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-inner">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Tele<span className="gradient-text">Gate</span>
                    </h1>
                    <p className="text-muted font-medium">Panel Administrativo</p>
                </div>

                <div className="premium-card p-8 shadow-2xl bg-surface/80 backdrop-blur-xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-fade-in">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="ejemplo@correo.com"
                                    className="w-full pl-12 pr-4 py-4 bg-background border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Contraseña
                                </label>
                                <Link href="#" className="text-xs font-bold text-primary hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-background border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8 text-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
                        <span className="bg-surface px-4">o continuar con</span>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Error al conectar con Google")}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                            locale="es"
                            text="continue_with"
                        />
                    </div>
                </div>

                <p className="text-center text-sm font-medium text-muted">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="text-primary font-bold hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>

            <footer className="absolute bottom-8 text-center w-full text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-4">
                <span>Diseñado para Creadores</span>
                <span className="w-1 h-1 bg-muted rounded-full" />
                <span>Seguro & Encriptado</span>
            </footer>
        </div >
    );
}
