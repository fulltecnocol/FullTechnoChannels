"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Zap,
    ShieldCheck,
    TrendingUp,
    Users,
    ArrowRight,
    Globe,
    Lock,
    CreditCard,
    Menu,
    X,
    ChevronRight
} from "lucide-react";
import dynamic from "next/dynamic";
const ProductShowcase = dynamic(() => import("@/components/landing/ProductShowcase").then(mod => mod.ProductShowcase), {
    ssr: false,
    loading: () => <div className="h-[250vh] bg-background animate-pulse" />
});
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            {/* Navigation */}
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${isScrolled
                    ? "py-4 bg-background/80 backdrop-blur-xl border-surface-border shadow-2xl"
                    : "py-6 bg-transparent border-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary via-[#F59E0B] to-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                            <Bot className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-white">
                            Tele<span className="text-primary italic">Gate</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/how-it-works" className="text-sm font-bold text-muted hover:text-primary transition-colors">Cómo Funciona</Link>
                        <Link href="/#features" className="text-sm font-bold text-muted hover:text-primary transition-colors">Características</Link>
                        <div className="h-4 w-px bg-surface-border mx-2" />
                        <Link href="/login" className="text-sm font-bold text-muted hover:text-foreground transition-colors">Login</Link>
                        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl px-6">
                            <Link href="/register">Empezar Ahora</Link>
                        </Button>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6">
                            <Link href="/how-it-works" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</Link>
                            <Link href="/#features" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>Características</Link>
                            <Link href="/login" className="text-2xl font-black text-muted" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                            <Button asChild size="lg" className="w-full text-lg h-14 font-black">
                                <Link href="/register">Registrarse</Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

                    <div className="max-w-5xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-surface-border rounded-full"
                        >
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Telegate v2.5 Operativo</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]"
                        >
                            Monetiza tu <br />
                            <span className="gradient-text italic">Telegram</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-muted font-medium max-w-2xl mx-auto leading-relaxed"
                        >
                            La plataforma definitiva para gestionar membresías premium, redes de afiliados y pagos internacionales 100% en piloto automático.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button asChild size="lg" className="h-14 px-8 bg-white text-black hover:bg-neutral-200 font-black rounded-xl shadow-2xl shadow-white/5 group">
                                <Link href="/register">
                                    Crear Mi Canal Premium <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-14 px-8 border-surface-border bg-surface/50 font-bold rounded-xl">
                                <Link href="/how-it-works">Ver Cómo Funciona</Link>
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Product Showcase - The WOW Factor */}
                <section id="showcase">
                    <ProductShowcase />
                </section>

                {/* Triple Feature Grid */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="premium-card p-8 space-y-6 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                    <ShieldCheck className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Bot Guardián</h3>
                                <p className="text-muted font-medium">Control automático de acceso. Expulsión inmediata al vencer la suscripción. Sin intervención manual.</p>
                            </div>

                            <div className="premium-card p-8 space-y-6 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Red de Afiliados</h3>
                                <p className="text-muted font-medium">Motor multinivel de 10 niveles. Incentiva a tu comunidad a escalar tus ventas de forma viral.</p>
                            </div>

                            <div className="premium-card p-8 space-y-6 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Globe className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Pagos Globales</h3>
                                <p className="text-muted font-medium">Stripe, Wompi y Cryptos integradas. Recibe tus ganancias en menos de 24 horas.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Strip */}
                <section className="py-20 px-6 bg-surface/30 border-y border-surface-border">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white italic">Únete a la elite de creadores.</h2>
                        <Button asChild size="lg" className="h-16 px-12 bg-primary text-primary-foreground font-black text-xl rounded-2xl hover:scale-105 active:scale-95 transition-all">
                            <Link href="/register">Registrar Mi Canal VIP</Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="py-12 px-6 border-t border-surface-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-primary" />
                        <span className="font-bold text-white">TeleGate</span>
                        <span className="text-xs text-muted">© 2026 Admin Dashboard. </span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold text-muted uppercase tracking-widest">
                        <Link href="/how-it-works" className="hover:text-white transition-colors">Legal</Link>
                        <Link href="/how-it-works" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link href="/how-it-works" className="hover:text-white transition-colors">Soporte</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
