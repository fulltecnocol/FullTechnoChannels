"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, Zap, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await authApi.register(formData);
            window.location.href = "/login?registered=true";
        } catch (err: any) {
            setError(err.message || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-inner">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Únete a <span className="gradient-text">VIP</span>
                    </h1>
                    <p className="text-muted font-medium">Automatiza tu comunidad hoy mismo</p>
                </div>

                <div className="premium-card p-8 shadow-2xl bg-surface/80 backdrop-blur-xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-fade-in">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                                Nombre Completo
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary" />
                                <input
                                    id="fullName"
                                    type="text"
                                    required
                                    placeholder="Juan Pérez"
                                    className="w-full pl-12 pr-4 py-4 bg-background border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

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
                            <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="Min. 8 caracteres"
                                    className="w-full pl-12 pr-4 py-4 bg-background border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:scale-100"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Crear Cuenta Premium
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-sm font-medium text-muted">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                        Inicia sesión aquí
                    </Link>
                </p>

                <div className="flex items-center justify-center gap-6 pt-4 grayscale opacity-50">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-center">Protección SSL de Grado Bancario</span>
                </div>
            </div>
        </div>
    );
}
