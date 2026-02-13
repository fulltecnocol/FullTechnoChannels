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
    X
} from "lucide-react";
import { ProductShowcase } from "@/components/landing/ProductShowcase";

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

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
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Funcionalidades</a>
                            <a href="#affiliates" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Red Multinivel</a>
                            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white p-2">Cómo Funciona</Link>
                        </div>
                        <div className="pt-4 border-t border-surface-border flex flex-col gap-4">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-muted border border-surface-border rounded-xl">Iniciar Sesión</Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center bg-primary text-primary-foreground rounded-xl font-bold">Empezar Ahora</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10 opacity-50" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Plataforma Auto-Gestionable · 2026 Ready</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                            El estándar <span className="gradient-text italic">Premium</span> para tu comunidad.
                        </h1>
                        <p className="text-xl text-muted max-w-xl leading-relaxed">
                            TeleGate automatiza la gestión de miembros, red de afiliados y pagos globales con la infraestructura de elite de <span className="text-foreground font-bold">Full Techno HUB</span>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/register" className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all">
                                Lanzar mi Canal TeleGate <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#features" className="flex items-center justify-center gap-3 px-8 py-4 bg-surface border border-surface-border rounded-2xl font-black text-lg hover:bg-surface-border transition-all">
                                Ver Funcionalidades <Zap className="w-5 h-5 text-amber-500" />
                            </a>
                        </div>
                        <div className="flex items-center gap-6 pt-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} className="w-10 h-10 rounded-full border-2 border-background" alt="User" />
                                ))}
                            </div>
                            <p className="text-xs font-bold text-muted">Protegiendo a +1,200 canales VIP en todo el mundo.</p>
                        </div>
                    </div>
                    <div className="relative animate-float lg:block flex justify-center">
                        <div className="w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-primary/20 bg-surface relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                            <img src="/saas_hero_illustration.png" alt="TeleGate Dashboard" className="w-full h-full object-cover" />
                        </div>
                        {/* Floating Stats Card */}
                        <div className="absolute -bottom-10 -left-10 premium-card p-6 scale-90 hidden sm:block animate-fade-in-up">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted">Cobros en Tiempo Real</p>
                                    <p className="text-2xl font-black text-primary">+$4,290.00</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-md">+24% hoy</span>
                                <div className="h-1 flex-1 bg-surface-border rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scroll-Linked Product Showcase */}
            <ProductShowcase />

            {/* Global Payments Section */}
            <section className="py-24 border-y border-surface-border bg-surface/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                        <div className="col-span-1 md:col-span-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted mb-4 text-center md:text-left">Aceptamos todos los pagos</h4>
                        </div>
                        <div className="col-span-1 md:col-span-3 flex flex-wrap justify-center md:justify-end gap-10 opacity-60 grayscale hover:grayscale-0 transition-all">
                            <div className="flex items-center gap-3">
                                <img src="https://cdn.iconscout.com/icon/free/png-256/free-stripe-logo-icon-download-in-svg-png-gif-file-formats--business-company-brand-vol-6-pack-logos-icons-226456.png" className="h-6" alt="Stripe" />
                                <span className="font-bold text-lg">Stripe</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-[#ED1C24] rounded-full flex items-center justify-center text-white text-[10px] font-bold italic">W</div>
                                <span className="font-bold text-lg">Wompi Colombia</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-[#f3ba2f] rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-lg">USDT/Crypto</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe className="w-6 h-6 text-primary" />
                                <span className="font-bold text-lg">Pagos Internacionales</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Multilevel Section */}
            <section id="affiliates" className="py-24 px-6 lg:py-40 bg-background relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="flex flex-col gap-4">
                                {[
                                    { name: "Directo", percent: "3.0%", color: "bg-primary" },
                                    { name: "Generación II", percent: "1.0%", color: "bg-primary/80" },
                                    { name: "Generación III", percent: "0.5%", color: "bg-primary/60" },
                                    { name: "Embajador", percent: "0.1%", color: "bg-primary/40" },
                                    { name: "Infinitum", percent: "0.1%", color: "bg-primary/20" }
                                ].map((level, i) => (
                                    <div key={i} className="premium-card p-6 flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${level.color} flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                                                {10 - i}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{level.name}</p>
                                                <p className="text-xs text-muted">Nivel de profundidad</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-primary">{level.percent}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Crecimiento Exponencial</h2>
                            <h3 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight">
                                Sistema de Red de <span className="italic text-primary">10 Niveles</span>.
                            </h3>
                            <p className="text-xl text-muted leading-relaxed">
                                Deja que tus miembros vendan por ti. Nuestro motor de afiliados multinivel permite que tu canal se vuelva viral, pagando comisiones automáticas hasta en la décima generación.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Comisiones directas e indirectas automáticas.",
                                    "Rangos de prestigio: Bronce, Oro y Diamante.",
                                    "Control total de referidos desde el Dashboard.",
                                    "Notificaciones de ventas en tiempo real vía Telegram."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold text-sm">
                                        <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 lg:py-40 bg-surface/30">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Potencia tu Comunidad</h2>
                        <h3 className="text-4xl lg:text-5xl font-black tracking-tight">Todo lo que necesitas para escalar tu imperio VIP.</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Bot Guardián 24/7", desc: "Verificación instantánea. Aprueba la entrada y expulsa miembros expirados de forma automática.", icon: Bot, color: "text-blue-500" },
                            { title: "Wompi Colombia", desc: "Integración nativa para Nequi y PSE. Pagos y retiros automatizados en pesos colombianos.", icon: CreditCard, color: "text-[#ED1C24]" },
                            { title: "USDT / Crypto", desc: "Acepta pagos de cualquier rincón del mundo con criptomonedas. Seguridad sin fronteras.", icon: Globe, color: "text-[#f3ba2f]" },
                            { title: "Business Intelligence", desc: "Métricas avanzadas de MRR, LTV y retención de usuarios para una escala inteligente.", icon: TrendingUp, color: "text-primary" },
                            { title: "Triales y Ofertas", desc: "Crea links de prueba gratis o cupones de descuento para explotar tus ventas.", icon: Zap, color: "text-amber-500" },
                            { title: "Soporte Multi-Ticket", desc: "Resuelve dudas de tus suscriptores a través del bot con nuestro sistema de tickets.", icon: MessageSquare, color: "text-pink-500" }
                        ].map((f, i) => (
                            <div key={i} className="premium-card p-10 space-y-6 group hover:border-primary/30 transition-all">
                                <div className={`w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center ${f.color} group-hover:scale-110 transition-transform`}>
                                    <f.icon className="w-8 h-8" />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xl font-bold">{f.title}</h4>
                                    <p className="text-sm text-muted leading-relaxed font-medium">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 px-6 lg:py-40">
                <div className="max-w-5xl mx-auto premium-card bg-primary p-12 lg:p-24 text-center space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    <h3 className="text-4xl lg:text-7xl font-black tracking-tighter text-white relative z-10 leading-none">¿Listo para el siguiente nivel?</h3>
                    <p className="text-xl text-white/70 font-bold max-w-2xl mx-auto relative z-10 leading-relaxed">
                        Automatiza, escala y domina tu mercado con la tecnología de TeleGate. Una solución exclusiva de Full Techno HUB.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
                        <Link href="/register" className="px-10 py-5 bg-white text-primary rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                            Crear Canal TeleGate Gratis
                        </Link>
                        <Link href="/login" className="px-10 py-5 bg-black/20 text-white rounded-2xl font-black text-xl hover:bg-black/30 transition-all border border-white/20">
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-surface-border">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16">
                    <div className="col-span-2 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo_telegate.png" alt="TeleGate Logo" className="w-10 h-10 object-contain brightness-125 contrast-125 mix-blend-screen" />
                            <span className="font-bold text-xl tracking-tight leading-none text-white">TeleGate</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-bold">La infraestructura definitiva para la monetización de comunidades en Telegram.</p>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-primary/10 transition-all cursor-pointer">
                                <MessageSquare className="w-4 h-4 text-primary" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-primary/10 transition-all cursor-pointer">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-xs font-black uppercase tracking-widest text-foreground">Plataforma</h5>
                        <ul className="space-y-3 text-xs text-muted font-bold">
                            <li><a href="#" className="hover:text-primary">Dashboard</a></li>
                            <li><a href="#" className="hover:text-primary">Bot Telegram</a></li>
                            <li><a href="#" className="hover:text-primary">Red de Afiliados</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-xs font-black uppercase tracking-widest text-foreground">Soporte</h5>
                        <ul className="space-y-3 text-xs text-muted font-bold">
                            <li><a href="#" className="hover:text-primary">Documentación</a></li>
                            <li><a href="#" className="hover:text-primary">Tickets</a></li>
                            <li><a href="#" className="hover:text-primary">FAQ</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-xs font-black uppercase tracking-widest text-foreground">Legal</h5>
                        <ul className="space-y-3 text-xs text-muted font-bold">
                            <li><a href="#" className="hover:text-primary">Privacidad</a></li>
                            <li><a href="#" className="hover:text-primary">Términos</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-20 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-surface-border mt-20 text-[10px] font-black text-muted uppercase tracking-[0.4em]">
                    <p>© 2026 TeleGate. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-2">
                        Designed & Powered by <span className="text-primary">Full Techno HUB</span>
                    </p>
                </div>
            </footer>

            <style jsx global>{`
                .gradient-text {
                    background: linear-gradient(to right, var(--primary), #ffffff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-fade-in-up { animation: fade-in 1s ease-out 0.5s forwards; opacity: 0; }
                html { scroll-behavior: smooth; }
            `}</style>
        </div>
    );
}
