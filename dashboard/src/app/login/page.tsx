"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle, Bot } from "lucide-react";
import { authApi } from "@/lib/api";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ email: "", password: "" });

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

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[160px] animate-pulse" />

            <div className="w-full max-w-md space-y-10 animate-fade-in relative z-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent-gold to-secondary p-[1px] mb-4 shadow-2xl shadow-primary/20">
                        <div className="w-full h-full bg-background rounded-[22px] flex items-center justify-center">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Tele<span className="text-primary">Gate</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">Acceso Privado Premium</p>
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
        </div>
    );
}
