"use client";

import React from "react";
import Link from "next/link";
import {
    Users,
    Zap,
    ShieldCheck,
    TrendingUp,
    MessageSquare,
    ArrowRight,
    Bot,
    CreditCard,
    Network,
    LayoutGrid,
    Globe,
    Layers,
    DollarSign,
    CheckCircle2,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { publicApi } from "@/lib/api";


export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [config, setConfig] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
        setMounted(true);
        publicApi.getConfig()
            .then(setConfig)
            .catch(console.error);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground scroll-smooth font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-surface-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo_telegate.png" alt="TeleGate Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain brightness-110 contrast-125 mix-blend-screen" />
                        <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-white">Tele<span className="text-primary">Gate</span></span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-muted">
                        <a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a>
                        <a href="#affiliates" className="hover:text-primary transition-colors">Red Multinivel</a>
                        <Link href="/how-it-works" className="hover:text-primary transition-colors">Cómo Funciona</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-all">Iniciar Sesión</Link>
                        <Link href="/register" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Empezar Ahora
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Content */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-background border-b border-surface-border p-6 space-y-6 animate-fade-in">
                        <div className="flex flex-col gap-4 text-center font-bold">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
                            <a href="#affiliates" onClick={() => setMobileMenuOpen(false)}>Red Multinivel</a>
                            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</Link>
                            <div className="h-[1px] bg-surface-border my-2" />
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Iniciar Sesión</Link>
                            <Link href="/register" className="bg-primary text-primary-foreground py-4 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                                Empezar Ahora
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-surface-border mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted">Fase de Lanzamiento v2.0</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-fade-in">
                        Gestiona tus Usuarios<br />
                        <span className="gradient-text">Como un Profesional</span>
                    </h1>

                    <p className="max-w-2xl mx-auto md:text-xl font-medium text-muted mb-12 animate-fade-in animation-delay-200">
                        La infraestructura definitiva para creadores de contenido. Automatiza membresías en Telegram, acepta pagos globales y haz crecer tu comunidad con una red multinivel potente.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-400">
                        <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-3">
                            Empezar Gratis
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-10 py-5 bg-surface border border-surface-border rounded-2xl font-black text-lg hover:bg-surface-border transition-all text-center">
                            Ver Características
                        </a>
                    </div>
                </div>
            </header>

            {/* Product Showcase - Visual Engine */}
            <section className="py-20 bg-surface/30">
                <div className="max-w-7xl mx-auto px-6">
                    <ProductShowcase />
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-y border-surface-border bg-background">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { label: "Usuarios Activos", value: "+10K", icon: Globe },
                        { label: "Volumen Procesado", value: "$450K+", icon: DollarSign },
                        { label: "Canales Gestionados", value: "850+", icon: LayoutGrid },
                        { label: "Retiros Completados", value: "100%", icon: CheckCircle2 },
                    ].map((stat, i) => (
                        <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary mb-2">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-black text-white">{stat.value}</div>
                            <div className="text-xs font-black uppercase tracking-widest text-muted">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Key Features */}
            <section id="features" className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4">Arquitectura</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight">Potencia sin Límites</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Bot de Control Total",
                                desc: "Tu bot personal gestiona automáticamente las entradas, salidas y recordatorios de pago de tus suscriptores en tiempo real.",
                                icon: Bot,
                                color: "from-blue-500/20 to-cyan-500/20"
                            },
                            {
                                title: "Pagos Globales",
                                desc: "Acepta tarjetas, transferencias locales (Nequi, Wompi) y Criptomonedas (USDT) con liquidación automática.",
                                icon: CreditCard,
                                color: "from-emerald-500/20 to-teal-500/20"
                            },
                            {
                                title: "Panel Premium",
                                desc: "Dashboard de lujo con analíticas avanzadas, gestión masiva de canales y sistema de branding personalizado.",
                                icon: LayoutGrid,
                                color: "from-amber-500/20 to-orange-500/20"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="premium-card group hover:scale-[1.02] transition-all p-8 flex flex-col items-start gap-6 border border-white/5">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-2 shadow-inner group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h4 className="text-2xl font-black text-white">{feature.title}</h4>
                                <p className="text-muted font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Multi-level Affiliates */}
            <section id="affiliates" className="py-32 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-20 blur-3xl saturate-200 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />

                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Sistema Multinivel</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                            Tu Comunidad Trabaja <span className="gradient-text">Para Ti</span>
                        </h3>
                        <p className="text-xl text-muted font-medium leading-relaxed">
                            Convierte a tus suscriptores en tus mejores vendedores. Nuestro sistema de afiliados de 2 niveles te permite escalar tus ingresos viralmente.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Nivel 1 (Directos)", value: `${((config.affiliate_level_1_fee || 0.03) * 100).toFixed(1)}% de cada suscripción`, icon: Users },
                                { title: "Nivel 2 (Generación II)", value: `${((config.affiliate_level_2_fee || 0.01) * 100).toFixed(1)}% de cada suscripción`, icon: Network },
                                { title: "Generaciones III-X", value: "Comisiones en profundidad hasta el nivel 10.", icon: Zap },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-surface border border-surface-border">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black uppercase tracking-widest text-primary mb-1">{item.title}</div>
                                        <div className="text-xl font-bold text-white">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="premium-card p-10 bg-slate-900 shadow-[0_0_100px_rgba(var(--primary-rgb),0.3)] animate-float border border-primary/20">
                            <h4 className="text-2xl font-black text-white mb-10 border-b border-primary/20 pb-6 flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-primary" />
                                Simulación de Ganancia
                            </h4>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted">Aportes Nivel 1</div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className="h-full bg-primary w-[70%] animate-grow-horizontal" />
                                    </div>
                                    <div className="text-2xl font-black text-white">$2,450.00 <span className="text-primary text-xs font-bold">+12%</span></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted">Aportes Nivel 2</div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className="h-full bg-emerald-500 w-[45%] animate-grow-horizontal transition-delay-500" />
                                    </div>
                                    <div className="text-2xl font-black text-white">$1,120.00 <span className="text-emerald-500 text-xs font-bold">+8%</span></div>
                                </div>
                                <div className="pt-8 border-t border-primary/10 mt-10">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">Comisión Total Mensual</div>
                                    <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">$3,570.00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 bg-background relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-12 animate-fade-in">¿Listo para escalar al <span className="gradient-text tracking-tighter">Siguiente Nivel?</span></h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in animation-delay-300">
                        <Link href="/register" className="w-full sm:w-auto px-12 py-6 bg-primary text-primary-foreground rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.05] transition-all">
                            Crear mi cuenta ahora
                        </Link>
                        <a href="https://t.me/TuBotDeAyuda" target="_blank" className="w-full sm:w-auto px-12 py-6 bg-surface border border-surface-border rounded-2xl font-black text-xl hover:bg-surface-border transition-all flex items-center justify-center gap-3">
                            <Bot className="w-6 h-6" />
                            Hablar con Soporte
                        </a>
                    </div>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="py-20 border-t border-surface-border bg-surface/20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-12">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black">T</div>
                            <span className="font-extrabold text-2xl tracking-tighter text-white">TeleGate</span>
                        </div>
                        <p className="text-sm font-medium text-muted">© {new Date().getFullYear()} TeleGate Platform. Todos los derechos reservados.</p>
                    </div>

                    <div className="flex gap-12">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Plataforma</h5>
                            <div className="flex flex-col gap-2 text-sm font-bold text-muted">
                                <a href="#">Dashboard</a>
                                <a href="#">Canales</a>
                                <a href="#">Retiros</a>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Legal</h5>
                            <div className="flex flex-col gap-2 text-sm font-bold text-muted">
                                <a href="#">Terminos</a>
                                <a href="#">Privacidad</a>
                                <a href="#">Cookies</a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#" className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-all">
                            <MessageSquare className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-all">
                            <Globe className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
