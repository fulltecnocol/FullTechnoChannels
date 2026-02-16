"use client";

import React from "react";
import Link from "next/link";
import {
    Bot,
    CreditCard,
    Network,
    TrendingUp,
    ShieldCheck,
    Zap,
    Users,
    ArrowRight,
    CheckCircle2,
    LayoutGrid,
    Globe,
    Lock,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { publicApi } from "@/lib/api";

export default function HowItWorksPage() {
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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Navigation (Simplified for this page) */}
            <nav className="fixed top-0 w-full z-50 border-b border-surface-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent-gold to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <Bot className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="font-extrabold text-2xl tracking-tighter text-white">
                            Tele<span className="text-primary">Gate</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-all">
                            Iniciar Sesión
                        </Link>
                        <Link href="/register" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Empezar Ahora
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-muted hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-surface border-b border-surface-border p-6 space-y-6 animate-fade-in z-50">
                        <div className="flex flex-col gap-4">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Inicio</Link>
                            <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Funcionalidades</Link>
                            <Link href="/#affiliates" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Red Multinivel</Link>
                        </div>
                        <div className="pt-4 border-t border-surface-border flex flex-col gap-4">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-muted border border-surface-border rounded-xl">Iniciar Sesión</Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center bg-primary text-primary-foreground rounded-xl font-bold">Empezar Ahora</Link>
                        </div>
                    </div>
                )}
            </nav>

            <main className="pt-32 pb-20">
                {/* Hero Section */}
                <section className="px-6 mb-32 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-surface-border rounded-full">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Documentación Oficial del Sistema</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-tight">
                            Arquitectura de <br />
                            <span className="gradient-text">Monetización Autónoma</span>
                        </h1>
                        <p className="text-xl text-muted font-medium leading-relaxed max-w-2xl mx-auto">
                            Descubre cómo TeleGate integra gestión, seguridad y distribución financiera en un solo núcleo operativo. Sin intervención manual. Sin errores.
                        </p>
                    </div>
                </section>

                {/* Step 1: The Core (Dashboard & Bot) */}
                <section className="max-w-7xl mx-auto px-6 mb-40">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 space-y-8">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                                <span className="font-black text-primary text-xl">1</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">El Cerebro Digital</h2>
                            <p className="text-lg text-muted leading-relaxed font-medium">
                                Todo comienza cuando conectas tu canal de Telegram a TeleGate. Nuestro <span className="text-white font-bold">Bot Guardián</span> asume el control inmediato de la seguridad.
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-surface rounded-xl border border-surface-border flex items-start gap-4">
                                    <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-white">Validación de Ingreso</h4>
                                        <p className="text-sm text-muted">Nadie entra a tu canal sin un pago verificado. El bot genera enlaces únicos de un solo uso.</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-surface rounded-xl border border-surface-border flex items-start gap-4">
                                    <Bot className="w-6 h-6 text-primary shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-white">Expulsión Automática</h4>
                                        <p className="text-sm text-muted">Cuando una suscripción vence, el bot elimina al usuario instantáneamente y le envía una invitación para renovar.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            {/* Visual Logic of Bot */}
                            <div className="relative premium-card p-6 md:p-8 aspect-auto md:aspect-video flex items-center justify-center min-h-[400px] md:min-h-0">
                                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />

                                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                    {/* User Node */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-surface border border-surface-border flex items-center justify-center relative z-10">
                                            <Users className="w-8 h-8 text-muted" />
                                        </div>
                                        <span className="text-xs font-black uppercase text-muted">Usuario</span>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="w-1 md:w-24 h-12 md:h-[2px] bg-surface-border relative overflow-hidden">
                                        <div className="absolute inset-x-0 md:inset-0 bg-primary h-1/2 md:w-1/2 md:h-full animate-grow-vertical md:animate-grow-horizontal" />
                                    </div>

                                    {/* Bot Node */}
                                    <div className="flex flex-col items-center gap-2 relative">
                                        <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center relative z-10 shadow-2xl shadow-primary/30">
                                            <Bot className="w-10 h-10 text-primary-foreground" />
                                        </div>
                                        <span className="text-xs font-black uppercase text-primary">Guardian Bot</span>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="w-1 md:w-24 h-12 md:h-[2px] bg-surface-border relative overflow-hidden">
                                        <div className="absolute inset-x-0 md:inset-0 bg-primary h-full md:w-full md:h-full animate-grow-vertical md:animate-grow-horizontal" style={{ animationDelay: '0.5s' }} />
                                    </div>

                                    {/* Channel Node */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-xl bg-surface border border-surface-border flex items-center justify-center relative z-10">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-xs font-black uppercase text-white">Canal VIP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 2: Payments & Splits (80/20) */}
                <section className="bg-surface/30 py-32 border-y border-surface-border mb-40">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                            <div className="lg:w-1/2 space-y-8">
                                <div className="w-12 h-12 bg-[#ED1C24]/20 rounded-xl flex items-center justify-center border border-[#ED1C24]/20">
                                    <span className="font-black text-[#ED1C24] text-xl">2</span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">El Motor Financiero</h2>
                                <p className="text-lg text-muted leading-relaxed font-medium">
                                    Olvídate de la contabilidad manual. Cada pago procesado se dispersa en tiempo real según la <span className="text-white font-bold">Regla Dorada del 80/20</span>.
                                </p>

                                <div className="premium-card p-6 border-primary/20 bg-primary/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-primary uppercase text-xs">Distribución Automática de Ingresos</span>
                                        <span className="font-black text-white text-xs">$100.00 USD (Ejemplo)</span>
                                    </div>
                                    <div className="flex h-12 rounded-lg overflow-hidden w-full shadow-lg">
                                        <div
                                            className="bg-gradient-to-r from-primary to-accent-gold flex items-center justify-center relative overflow-hidden group"
                                            style={{ width: `${(1 - (config.platform_fee || 0.20)) * 100}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <span className="text-[10px] sm:text-xs md:text-sm font-black text-white z-10">
                                                {((1 - (config.platform_fee || 0.20)) * 100).toFixed(0)}% PARA TI
                                            </span>
                                        </div>
                                        <div
                                            className="bg-zinc-800 flex items-center justify-center border-l border-white/10"
                                            style={{ width: `${(config.platform_fee || 0.20) * 100}%` }}
                                        >
                                            <span className="text-[8px] sm:text-xs font-black text-white/50">
                                                {(config.platform_fee || 0.20) * 100}% ECO
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted mt-3 text-center">
                                        * El {(config.platform_fee || 0.20) * 100}% del Ecosystem cubre: Tarifas de pasarela, infraestructura de servidores, mantenimiento del bot y la <span className="text-primary font-bold">Red de Afiliados</span>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-background rounded-xl border border-surface-border text-center">
                                        <h4 className="text-2xl font-black text-white mb-1">24h</h4>
                                        <p className="text-xs text-muted uppercase font-bold">Retiros Rápidos</p>
                                    </div>
                                    <div className="p-4 bg-background rounded-xl border border-surface-border text-center">
                                        <h4 className="text-2xl font-black text-white mb-1">0%</h4>
                                        <p className="text-xs text-muted uppercase font-bold">Costo Fijo Mensual</p>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:w-1/2">
                                <div className="premium-card p-8 lg:p-12 space-y-8">
                                    <h3 className="text-xl font-black uppercase text-center mb-8">Pasarelas Integradas</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-border hover:border-primary/50 transition-colors">
                                            <div className="w-10 h-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                                                <CreditCard className="text-white w-6 h-6" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white">Stripe & Tarjetas</h5>
                                                <p className="text-xs text-muted">Procesamiento global en USD/EUR.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-border hover:border-primary/50 transition-colors">
                                            <div className="w-10 h-10 bg-[#ED1C24] rounded-lg flex items-center justify-center text-white font-black italic">W</div>
                                            <div>
                                                <h5 className="font-bold text-white">Wompi (Colombia)</h5>
                                                <p className="text-xs text-muted">Nequi, PSE y Bancolombia.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-border hover:border-primary/50 transition-colors">
                                            <div className="w-10 h-10 bg-[#F3BA2F] rounded-lg flex items-center justify-center">
                                                <Globe className="text-white w-6 h-6" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white">Criptomonedas</h5>
                                                <p className="text-xs text-muted">USDT (TRC20/BEP20) automatizado.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 3: Affiliate System (10 Levels) */}
                <section className="max-w-7xl mx-auto px-6 mb-32">
                    <div className="text-center mb-20 space-y-6">
                        <div className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 mb-8">
                            <span className="font-black text-primary text-2xl">3</span>
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter">La Red de Poder</h2>
                        <p className="text-xl text-muted max-w-2xl mx-auto">
                            Transformamos la competencia en colaboración. Invita a otros <span className="text-white font-bold">Creadores de Contenido</span> a TeleGate y obtén una participación de sus ganancias netas automáticamente hasta <span className="text-primary font-bold">10 niveles de profundidad</span>.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                        {/* Interactive Levels Visualizer */}
                        <div className="lg:col-span-7 space-y-3">
                            {(() => {
                                const tiers = [
                                    { level: 1, name: "Directo", key: "affiliate_level_1_fee", fallback: 0.03, bg: "bg-primary", width: "100%" },
                                    { level: 2, name: "Generación II", key: "affiliate_level_2_fee", fallback: 0.01, bg: "bg-primary/90", width: "95%" },
                                    { level: 3, name: "Generación III", key: "affiliate_level_3_fee", fallback: 0.005, bg: "bg-primary/80", width: "90%" },
                                    { level: 4, name: "Círculo Interno", key: "affiliate_level_4_fee", fallback: 0.003, bg: "bg-primary/70", width: "85%" },
                                    { level: 5, name: "Liderazgo", key: "affiliate_level_5_fee", fallback: 0.002, bg: "bg-primary/60", width: "80%" },
                                    { level: 6, name: "Elite", key: "affiliate_level_6_fee", fallback: 0.001, bg: "bg-primary/50", width: "75%" },
                                    { level: 7, name: "Embajador", key: "affiliate_level_7_fee", fallback: 0.001, bg: "bg-primary/40", width: "70%" },
                                    { level: 8, name: "Maestro", key: "affiliate_level_8_fee", fallback: 0.001, bg: "bg-primary/30", width: "65%" },
                                    { level: 9, name: "Leyenda", key: "affiliate_level_9_fee", fallback: 0.001, bg: "bg-primary/20", width: "60%" },
                                    { level: 10, name: "Infinitum", key: "affiliate_level_10_fee", fallback: 0.001, bg: "bg-primary/10", width: "55%" },
                                ];

                                let cumulative = 0;

                                return tiers.map((item, idx) => {
                                    const rawVal = config[item.key];
                                    let val = Number(rawVal);
                                    if (isNaN(val) || rawVal === undefined) {
                                        val = item.fallback;
                                    }
                                    cumulative += val;

                                    // Current level percentage
                                    const currentPercent = (val * 100).toFixed(1);
                                    // Accumulated percentage
                                    const totalPercent = (cumulative * 100).toFixed(1);

                                    return (
                                        <div key={idx} className="relative group">
                                            <div className="absolute inset-0 bg-primary/5 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative premium-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-surface-border">
                                                <div className="flex items-center gap-6 w-full">
                                                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center text-black font-black text-lg shadow-lg shrink-0 border border-white/10`}>
                                                        L{item.level}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                                (+{currentPercent}%)
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1 bg-surface-border rounded-full mt-2 overflow-hidden hidden md:block">
                                                            <div className={`h-full ${item.bg}`} style={{ width: item.width }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 flex flex-col items-end">
                                                    <span className="text-xs text-muted font-bold uppercase tracking-wider">Potencial Total</span>
                                                    <span className="text-3xl font-black text-white">{totalPercent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Explanation Card */}
                        <div className="lg:col-span-5 relative">
                            <div className="sticky top-32 space-y-8">
                                <div className="premium-card p-8 bg-gradient-to-br from-surface to-background border-primary/20">
                                    <h3 className="text-2xl font-black tracking-tight mb-6">¿Qué significa esto para ti?</h3>

                                    <ul className="space-y-6">
                                        <li className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white">Ecosistema de Creadores</h5>
                                                <p className="text-sm text-muted">No solo ganas por tus ventas, sino un porcentaje del éxito de cada Creador que traigas a la plataforma.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Network className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white">Crecimiento Multinivel</h5>
                                                <p className="text-sm text-muted">Tu red escala orgánicamente. Cada nuevo canal en tu red expande tu flujo de ingresos pasivos de forma perpetua.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Zap className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white">Pagos Instantáneos</h5>
                                                <p className="text-sm text-muted">Las comisiones se acreditan en tiempo real al saldo de cada usuario. Sin esperas.</p>
                                            </div>
                                        </li>
                                    </ul>

                                    <div className="mt-8 pt-6 border-t border-surface-border">
                                        <Link href="/register" className="w-full py-4 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 font-black text-lg hover:bg-accent-gold transition-colors">
                                            Activar mi Ecosistema <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ / Final CTA */}
                <section className="px-6 py-20 text-center">
                    <h2 className="text-3xl font-black mb-8">¿Listo para cambiar las reglas del juego?</h2>
                    <p className="text-muted max-w-xl mx-auto mb-10">
                        La infraestructura está lista. El bot está esperando. Solo faltas tú.
                    </p>
                    <div className="flex justify-center gap-6">
                        <Link href="/register" className="px-10 py-4 bg-white text-black rounded-xl font-black shadow-2xl hover:scale-105 transition-transform">
                            Crear Cuenta Gratis
                        </Link>
                    </div>
                </section>
            </main>

            <style jsx global>{`
                .gradient-text {
                    background: linear-gradient(to right, var(--primary), #ffffff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .animate-grow-horizontal {
                    animation: grow 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes grow {
                    from { width: 0; }
                    to { width: 100%; }
                }
                @keyframes grow-vertical {
                    from { height: 0; }
                    to { height: 100%; }
                }
                .animate-grow-vertical {
                    animation: grow-vertical 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
}
