"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Wallet,
  LayoutGrid,
  Settings,
  PlusCircle,
  Copy,
  ArrowDownCircle,
  History,
  Loader2,
  LogOut,
  ShieldEllipsis,
  Send,
  LifeBuoy,
  MessageSquare,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronRight,
  Palette,
  PenTool,
  UserCircle,
  Lock,
  Ticket,
  Trash2,
  CreditCard,
  Menu,
  X
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar
} from "recharts";
import { ownerApi, adminApi } from "@/lib/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [isViewingAsAdmin, setIsViewingAsAdmin] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [editingBranding, setEditingBranding] = useState<any>(null);
  const [managingPromos, setManagingPromos] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, chanData, withData, tickData, anData] = await Promise.all([
        ownerApi.getSummary(),
        ownerApi.getChannels(),
        ownerApi.getWithdrawals(),
        ownerApi.getTickets(),
        ownerApi.getAnalytics()
      ]);
      setSummary(sumData);
      setChannels(chanData);
      setWithdrawals(withData);
      setTickets(tickData);
      setAnalyticsData(anData);

      if (sumData.is_admin) {
        const [configData, admWithData, admTickData, admPayData] = await Promise.all([
          adminApi.getConfig(),
          adminApi.getWithdrawals(),
          adminApi.getTickets(),
          adminApi.getPendingPayments()
        ]);
        setConfigs(configData);
        setAdminWithdrawals(admWithData);
        setAdminTickets(admTickData);
        setAdminPayments(admPayData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = async (id: number, isAdmin: boolean = false) => {
    try {
      setIsViewingAsAdmin(isAdmin);
      const resp = isAdmin ? await adminApi.getTicketDetails(id) : await ownerApi.getTicketDetails(id);
      setSelectedTicket(resp.ticket);
      setTicketMessages(resp.messages);
    } catch (err) {
      console.error("Error loading ticket details:", err);
    }
  };

  const handleReplyTicket = async (content: string) => {
    if (!selectedTicket || !content.trim()) return;
    try {
      if (isViewingAsAdmin) {
        await adminApi.replyTicket(selectedTicket.id, content);
      } else {
        await ownerApi.replyTicket(selectedTicket.id, content);
      }
      handleOpenTicket(selectedTicket.id, isViewingAsAdmin);
    } catch (err) {
      console.error("Error replying to ticket:", err);
    }
  };

  const handleCreateTicket = async (subject: string, content: string) => {
    try {
      await ownerApi.createTicket({ subject, content });
      fetchData();
      alert("Ticket creado exitosamente");
    } catch (err) {
      console.error("Error creating ticket:", err);
    }
  };

  const handleWithdrawalRequest = async (amount: number, method: string, details: string) => {
    try {
      if (amount < 50) {
        alert("El monto mínimo de retiro es $50.00");
        return;
      }
      await ownerApi.requestWithdrawal({ amount, method, details });
      fetchData();
      alert("Solicitud de retiro enviada con éxito.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProcessWithdrawal = async (id: number, status: string) => {
    try {
      await adminApi.processWithdrawal(id, status);
      fetchData();
      alert(status === 'completed' ? "Retiro aprobado correctamente" : "Retiro rechazado");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyCrypto = async (id: number) => {
    try {
      if (!confirm("¿Has verificado manualmente que el pago es correcto en la Blockchain?")) return;
      await adminApi.verifyCryptoPayment(id);
      fetchData();
      alert("Pago verificado y membresía activada correctamente.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfigUpdate = async (key: string, value: number) => {
    try {
      await adminApi.updateConfig(key, value);
      const configData = await adminApi.getConfig();
      setConfigs(configData);
      alert("Configuración actualizada correctamente");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateBranding = async (channelId: number, welcome: string, expiration: string) => {
    try {
      await ownerApi.updateBranding(channelId, {
        welcome_message: welcome,
        expiration_message: expiration
      });
      fetchData();
      setEditingBranding(null);
      alert("Branding actualizado correctamente");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (full_name: string, avatar_url: string) => {
    try {
      await ownerApi.updateProfile({ full_name, avatar_url });
      fetchData();
      alert("Perfil actualizado correctamente");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenPromos = async (channel: any) => {
    try {
      const data = await ownerApi.getPromotions(channel.id);
      setPromotions(data);
      setManagingPromos(channel);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePromo = async (channelId: number, data: any) => {
    try {
      await ownerApi.createPromotion(channelId, data);
      const updatedPromos = await ownerApi.getPromotions(channelId);
      setPromotions(updatedPromos);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePromo = async (promoId: number) => {
    try {
      if (!confirm("¿Seguro que quieres eliminar esta oferta?")) return;
      await ownerApi.deletePromotion(promoId);
      if (managingPromos) {
        const updatedPromos = await ownerApi.getPromotions(managingPromos.id);
        setPromotions(updatedPromos);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePassword = async (current: string, next: string) => {
    try {
      await ownerApi.updatePassword({ current_password: current, new_password: next });
      alert("Contraseña cambiada con éxito");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleCreateChannel = async () => {
    const title = prompt("Introduce el nombre de tu nuevo canal:");
    if (title) {
      try {
        await ownerApi.createChannel(title);
        fetchData(); // Recargar datos
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Código copiado al portapapeles. Úsalo con el bot.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted font-bold animate-pulse">Cargando TeleGate...</p>
      </div>
    );
  }

  const stats = [
    { label: "Mis Suscriptores", value: summary?.active_subscribers || "0", change: "En tiempo real", icon: Users, color: "text-emerald-500" },
    { label: "Balance Disponible", value: `$${(summary?.available_balance || 0).toFixed(2)}`, change: "De tus canales", icon: Wallet, color: "text-blue-500" },
    { label: "Ganancia Afiliados", value: `$${(summary?.affiliate_balance || 0).toFixed(2)}`, change: "Vitalicia", icon: TrendingUp, color: "text-amber-500" },
    { label: "Canales Activos", value: summary?.active_channels || "0", change: "OK", icon: LayoutGrid, color: "text-emerald-400" },
  ];

  const withdrawalOptions = [
    { id: "stripe", name: "Stripe / Tarjeta", description: "Transferencia directa a cuenta vinculada.", active: true },
    { id: "wompi", name: "Wompi / Nequi (Colombia)", description: "Transferencia en tiempo real a Nequi o Bancos.", active: false },
    { id: "crypto", name: "USDT / Crypto", description: "Pago en Stablecoins (Red TRC20).", active: false },
  ];

  const [selectedMethod, setSelectedMethod] = useState("wompi");

  return (
    <div className="flex min-h-screen bg-background" aria-label="Panel de Administración del Creador">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-64 flex flex-col border-r border-surface-border bg-surface p-6 space-y-8 z-[70] transition-transform duration-300 md:relative md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black">T</div>
            <span className="font-bold text-xl tracking-tight">TeleGate</span>
          </div>
          <button className="md:hidden text-muted hover:text-white" onClick={() => setMobileSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {[
            { id: "overview", label: "Vista General", icon: LayoutGrid },
            { id: "channels", label: "Mis Canales", icon: Users },
            { id: "affiliates", label: "Afiliados", icon: Zap },
            { id: "support", label: "Soporte", icon: LifeBuoy },
            { id: "wallet", label: "Billetera", icon: Wallet },
            { id: "settings", label: "Configuración", icon: Settings },
            ...(summary?.is_admin ? [
              { id: "admin", label: "Admin Sistema", icon: ShieldEllipsis },
              { id: "admin_payments", label: "Admin Pagos", icon: CreditCard }
            ] : []),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsViewingAsAdmin(item.id.startsWith("admin"));
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted hover:bg-surface-border"}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </nav>

        <div className="premium-card p-4 bg-primary/5 border-primary/10 text-xs font-bold text-primary flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Plan Pro Premium
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 space-y-10 max-w-7xl mx-auto overflow-y-auto">
        {/* Header Responsive */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center justify-between md:block">
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-muted hover:text-white"
              >
                <Menu className="w-7 h-7" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">T</div>
                <span className="font-bold text-lg tracking-tight">TeleGate</span>
              </div>
            </div>

            <div className="hidden md:block">
              <h1 className="text-3xl font-bold tracking-tight">
                Panel de <span className="gradient-text">Control</span>
              </h1>
              <p className="text-muted mt-1 font-medium">Gestiona tus comunidades y ganancias hoy.</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="md:hidden">
              <h1 className="text-2xl font-bold tracking-tight">
                Panel de <span className="gradient-text">Control</span>
              </h1>
            </div>
            <button
              onClick={handleCreateChannel}
              className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-base"
            >
              <PlusCircle className="w-5 h-5" /> <span className="hidden sm:inline">Nuevo Canal</span><span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        {managingPromos && (
          <div className="space-y-10 animate-fade-in premium-card p-10 bg-surface/50 border-amber-500/20">
            <header className="flex items-center justify-between border-b border-surface-border pb-6">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 text-amber-500">
                  <Ticket className="w-8 h-8" /> Promociones: {managingPromos.title}
                </h2>
                <p className="text-muted font-medium">Crea links de oferta y pases de cortesía para atraer nuevos miembros.</p>
              </div>
              <button
                onClick={() => setManagingPromos(null)}
                className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors"
              >
                Cerrar
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Formulario Nueva Promo */}
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 bg-background rounded-2xl border border-surface-border space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Nueva Oferta</h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Código del Link</label>
                    <input id="p_code" type="text" placeholder="EJ: VERANO50" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold uppercase transition-all focus:ring-1 ring-amber-500 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Tipo de Oferta</label>
                    <select id="p_type" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500">
                      <option value="discount">Descuento (Primer Pago %)</option>
                      <option value="trial">Días Gratis (Prueba sin Tarjeta)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Valor (Días o % decimal)</label>
                    <input id="p_value" type="number" step="0.01" placeholder="Ej: 7 o 0.50 para 50%" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Límite de Usos (Opcional)</label>
                    <input id="p_max" type="number" placeholder="Ej: 20" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500" />
                  </div>

                  <button
                    onClick={() => {
                      const code = (document.getElementById('p_code') as HTMLInputElement).value;
                      const type = (document.getElementById('p_type') as HTMLSelectElement).value;
                      const value = parseFloat((document.getElementById('p_value') as HTMLInputElement).value);
                      const max = (document.getElementById('p_max') as HTMLInputElement).value;
                      if (!code || !value) return alert("Completa los campos obligatorios");
                      handleCreatePromo(managingPromos.id, { code, promo_type: type, value, max_uses: max ? parseInt(max) : null });
                    }}
                    className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                  >
                    Generar Link de Oferta
                  </button>
                </div>
              </div>

              {/* Lista de Promos Activas */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Links de Oferta Activos</h3>
                <div className="premium-card overflow-hidden divide-y divide-surface-border">
                  {promotions.length > 0 ? promotions.map(p => (
                    <div key={p.id} className="p-6 flex items-center justify-between hover:bg-background/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-amber-500 tracking-tight">{p.code}</span>
                          <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${p.promo_type === 'trial' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                            {p.promo_type === 'trial' ? 'PRUEBA GRATIS' : 'DESCUENTO'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            copyToClipboard(`https://t.me/TuBotMembresiaBot?start=${p.code}`);
                          }}
                          className="text-[10px] text-muted flex items-center gap-1.5 hover:text-primary transition-colors font-mono"
                        >
                          t.me/bot?start={p.code} <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] text-muted font-black uppercase tracking-widest">Usos</p>
                          <p className="text-sm font-black text-primary">{p.current_uses} / {p.max_uses || '∞'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted font-black uppercase tracking-widest">Valor</p>
                          <p className="text-sm font-black text-primary">
                            {p.promo_type === 'discount' ? `-${(p.value * 100).toFixed(0)}%` : `${p.value} días`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePromo(p.id)}
                          className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-all hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 text-center space-y-3">
                      <Ticket className="w-12 h-12 text-muted mx-auto opacity-20" />
                      <p className="text-muted font-bold">No has creado ninguna oferta para este canal todavía.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {editingBranding && (
          <div className="space-y-10 animate-fade-in premium-card p-10 bg-surface/50 border-primary/20">
            <header className="flex items-center justify-between border-b border-surface-border pb-6">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                  <Palette className="w-8 h-8" /> Branding: {editingBranding.title}
                </h2>
                <p className="text-muted font-medium">Personaliza el lenguaje de tu marca en Telegram.</p>
              </div>
              <button
                onClick={() => setEditingBranding(null)}
                className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors"
              >
                Cancelar
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> Mensaje de Bienvenida
                  </label>
                  <p className="text-xs text-muted">Se envía cuando alguien completa su pago exitosamente.</p>
                  <textarea
                    id="welcome_msg"
                    defaultValue={editingBranding.welcome_message || "¡Hola! Bienvenido a mi comunidad premium."}
                    rows={4}
                    className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <History className="w-4 h-4" /> Mensaje de Expiración
                  </label>
                  <p className="text-xs text-muted">Se envía 24h antes de que termine su suscripción.</p>
                  <textarea
                    id="expiration_msg"
                    defaultValue={editingBranding.expiration_message || "Tu suscripción está por vencer. ¡Renuévala para no perder el acceso!"}
                    rows={4}
                    className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none text-sm font-medium"
                  />
                </div>

                <button
                  onClick={() => {
                    const welcome = (document.getElementById('welcome_msg') as HTMLTextAreaElement).value;
                    const expiration = (document.getElementById('expiration_msg') as HTMLTextAreaElement).value;
                    handleUpdateBranding(editingBranding.id, welcome, expiration);
                  }}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Guardar Cambios de Marca
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                  <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Consejos de Branding
                  </h4>
                  <ul className="text-xs text-muted space-y-2 list-disc pl-4 font-medium">
                    <li>Usa un tono que conecte con tu audiencia (ej: VIP, Master, Amigo).</li>
                    <li>Menciona los beneficios clave del acceso premium.</li>
                    <li>Incluye instrucciones claras de qué hacer después de unirse.</li>
                  </ul>
                </div>
                <div className="p-8 bg-background border border-surface-border rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter rounded-bl-2xl">Vista Previa Bot</div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black text-xs">BT</div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">Membership Bot</p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">bot oficial</p>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-border/20 rounded-2xl text-xs leading-relaxed font-medium italic">
                    "El mensaje personalizado aparecerá aquí siguiendo el estilo de Telegram..."
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!editingBranding && activeTab === "overview" && (
          <div className="space-y-10 animate-fade-in">
            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="premium-card p-6 flex flex-col justify-between group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-background border border-surface-border group-hover:border-primary/50 transition-colors">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </section>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="premium-card p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Ingresos (30d)
                  </h3>
                  <div className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">Crecimiento Positivo</div>
                </div>
                <div className="h-48 md:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.revenue_series || []}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="premium-card p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Nuevos Suscriptores
                  </h3>
                  <div className="text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 px-2 py-1 rounded">Suscripciones Activas</div>
                </div>
                <div className="h-48 md:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.subscriber_series || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="premium-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Ganancias de Red (10 Niveles)
                </h3>
                <div className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 px-2 py-1 rounded">Ingreso Pasivo</div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.mlm_series || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* My Channels Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2.5">
                    <LayoutGrid className="w-5 h-5 text-primary" /> Mis Canales
                  </h2>
                  <button className="text-sm font-bold text-primary hover:underline">Ver detalles</button>
                </div>

                <div className="premium-card overflow-hidden">
                  <div className="divide-y divide-surface-border">
                    {channels.length > 0 ? channels.map((ch) => (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-secondary-foreground shadow-sm shrink-0">
                            {ch.title[0]}
                          </div>
                          <div>
                            <p className="font-bold">{ch.title}</p>
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                              {ch.is_verified ? 'Verificado' : 'Pendiente'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-surface-border sm:border-0">
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest hidden sm:block">Código Bot</span>
                            <button
                              onClick={() => copyToClipboard(ch.validation_code)}
                              className="flex items-center gap-1 px-3 py-1 bg-background rounded-lg border border-surface-border text-xs font-mono hover:bg-surface-border transition-colors group"
                            >
                              <span className="text-primary group-hover:text-white transition-colors">{ch.validation_code}</span> <Copy className="w-3.5 h-3.5 text-muted" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPromos(ch)}
                              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all text-amber-500 border border-amber-500/20"
                              title="Ofertas y Cupones"
                            >
                              <Ticket className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingBranding(ch)}
                              className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all text-primary border border-primary/20"
                              title="Personalizar Branding"
                            >
                              <Palette className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center space-y-2">
                        <p className="text-muted font-bold tracking-tight">No tienes canales registrados todavía.</p>
                        <button onClick={handleCreateChannel} className="text-primary text-sm font-black hover:underline">Empieza registrando el primero aquí</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Quickview */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Billetera</h2>
                <div className="premium-card p-6 space-y-6">
                  <div className="p-4 bg-background rounded-2xl border border-surface-border space-y-1">
                    <p className="text-xs font-bold text-muted uppercase">Balance Neto</p>
                    <h3 className="text-3xl font-black text-primary tracking-tight">
                      ${((summary?.available_balance || 0) + (summary?.affiliate_balance || 0)).toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-muted">Incluye ganancias de canales y red de afiliados.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase">Monto a Retirar</label>
                      <input
                        type="number"
                        id="withdraw_amount"
                        placeholder="Mínimo $50.00"
                        className="w-full p-3 bg-background rounded-xl border border-surface-border font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase">Detalles del Destino (Cuenta / Wallet)</label>
                      <input
                        type="text"
                        id="withdraw_details"
                        placeholder="Nequi # / Wallet Address / IBAN"
                        className="w-full p-3 bg-background rounded-xl border border-surface-border font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted uppercase px-1">Método de Pago</p>
                      {withdrawalOptions.map(opt => (
                        <div key={opt.id}
                          onClick={() => setSelectedMethod(opt.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedMethod === opt.id ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-muted-foreground/20'
                            }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-foreground">{opt.name}</span>
                            {selectedMethod === opt.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">{opt.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const amount = parseFloat((document.getElementById('withdraw_amount') as HTMLInputElement).value);
                      const details = (document.getElementById('withdraw_details') as HTMLInputElement).value;
                      if (!details) return alert("Por favor introduce los detalles de retiro");
                      handleWithdrawalRequest(amount, selectedMethod, details);
                    }}
                    className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <ArrowDownCircle className="w-5 h-5" /> Solicitar Retiro
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                    * El proceso puede tardar hasta 48 horas hábiles.
                  </p>
                </div>
              </div>

              {/* Withdrawal History */}
              <div className="lg:col-span-1 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Historial de Retiros
                </h2>
                <div className="premium-card divide-y divide-surface-border overflow-hidden">
                  {withdrawals.length > 0 ? withdrawals.map(w => (
                    <div key={w.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">${w.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted">{mounted ? new Date(w.created_at).toLocaleDateString() : '...'}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        w.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                        {w.status === 'completed' ? 'Completado' : w.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-xs text-muted font-bold">No hay retiros registrados.</div>
                  )}
                </div>
              </div>
            </div>
            {/* Alertas y Notificaciones */}
            <div className="premium-card p-8 bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                  <Send className="w-6 h-6 text-primary" /> Notificaciones Telegram
                </h3>
                <p className="text-sm text-muted">Avisa a tus embajadores y recibe alertas de tus propias ventas al instante.</p>
              </div>

              {summary?.telegram_linked ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" /> Cuenta Vinculada
                </div>
              ) : (
                <button
                  onClick={() => window.open(`https://t.me/TuBotMembresiaBot?start=sync_${summary?.referral_code}`, '_blank')}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.05] transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  Vincular Telegram
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div className="space-y-10 animate-fade-in">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <LifeBuoy className="w-8 h-8 text-primary" /> Centro de Ayuda
                </h2>
                <p className="text-muted font-medium">Estamos aquí para ayudarte 24/7.</p>
              </div>
              {!selectedTicket && (
                <button
                  onClick={() => {
                    const subject = prompt("Asunto del Ticket:");
                    const content = prompt("Describe tu problema:");
                    if (subject && content) handleCreateTicket(subject, content);
                  }}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] flex items-center gap-2 transition-all"
                >
                  <PlusCircle className="w-5 h-5" /> Abrir Ticket
                </button>
              )}
              {selectedTicket && (
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2.5 bg-surface-border text-primary rounded-xl font-bold hover:bg-surface-border/80 transition-all"
                >
                  Volver al Listado
                </button>
              )}
            </header>

            {!selectedTicket ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.length > 0 ? tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTicket(t.id, false)}
                    className="premium-card p-6 space-y-4 cursor-pointer hover:border-primary/50 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${t.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                          'bg-surface-border text-muted border-surface-border'
                        }`}>
                        {t.status === 'open' ? 'Abierto' : t.status === 'pending' ? 'Pendiente tu respuesta' : 'Cerrado'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{t.subject}</h4>
                      <p className="text-xs text-muted mt-1">Última actualización: {mounted ? new Date(t.updated_at).toLocaleDateString() : '...'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center space-y-4 premium-card">
                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                      <LifeBuoy className="w-8 h-8 text-primary opacity-20" />
                    </div>
                    <p className="text-muted font-bold">No tienes tickets de soporte biertos.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto premium-card flex flex-col h-[600px]">
                <div className="p-6 border-b border-surface-border flex justify-between items-center bg-background/50">
                  <div>
                    <h3 className="text-xl font-black">{selectedTicket.subject}</h3>
                    <p className="text-xs text-muted font-bold">Ticket #{selectedTicket.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedTicket.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface/30">
                  {ticketMessages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === summary?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.sender_id === summary?.id
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-background border border-surface-border rounded-tl-none'
                        }`}>
                        <p className="font-medium leading-relaxed">{m.content}</p>
                        <p className={`text-[9px] mt-2 font-bold opacity-60 ${m.sender_id === summary?.id ? 'text-right' : ''}`}>
                          {new Date(m.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-surface-border bg-background">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      id="reply_content"
                      placeholder="Escribe tu mensaje..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleReplyTicket((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 p-4 bg-surface rounded-xl border border-surface-border focus:ring-1 ring-primary outline-none text-sm font-medium"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('reply_content') as HTMLInputElement;
                        handleReplyTicket(input.value);
                        input.value = "";
                      }}
                      className="p-4 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "admin" && (
          <div className="space-y-10 animate-fade-in">
            <header>
              <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                <ShieldEllipsis className="w-8 h-8" /> Configuración Maestro del Sistema
              </h2>
              <p className="text-muted font-medium">Controla las comisiones y umbrales de todo el SaaS.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tarjeta de Comisión Plataforma */}
              <div className="premium-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <LayoutGrid className="w-5 h-5" /> Comisión Plataforma
                </div>
                <p className="text-xs text-muted">El porcentaje total que se retiene de cada pago (ej: 0.10 para 10%).</p>
                <input
                  type="number" step="0.01"
                  defaultValue={configs.find(c => c.key === "platform_fee")?.value || 0.10}
                  className="w-full p-3 bg-background rounded-xl border border-surface-border text-lg font-bold"
                  onBlur={(e) => handleConfigUpdate("platform_fee", parseFloat(e.target.value))}
                />
              </div>

              {/* Configuración Multinivel (10 Niveles) */}
              <div className="md:col-span-2 lg:col-span-3 premium-card p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                      <Zap className="w-6 h-6" /> Comisiones Multinivel (10 Profundidades)
                    </h3>
                    <p className="text-sm text-muted">Define el % que gana cada nivel en la cadena de referidos.</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-black">
                    ACTIVO: MLM DEPTH 10
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { lv: 1, n: "Directo" }, { lv: 2, n: "Gen II" }, { lv: 3, n: "Gen III" },
                    { lv: 4, n: "C. Interno" }, { lv: 5, n: "Liderazgo" }, { lv: 6, n: "Elite" },
                    { lv: 7, n: "Embajador" }, { lv: 8, n: "Maestro" }, { lv: 9, n: "Leyenda" },
                    { lv: 10, n: "Infinitum" },
                  ].map((level) => (
                    <div key={level.lv} className="space-y-2 p-4 bg-background rounded-xl border border-surface-border">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{level.n}</label>
                      <input
                        type="number" step="0.001"
                        defaultValue={configs.find(c => c.key === `affiliate_level_${level.lv}_fee`)?.value || (level.lv === 1 ? 0.03 : 0.001)}
                        className="w-full p-2 bg-surface-border/30 rounded-lg text-sm font-bold focus:ring-1 ring-primary outline-none"
                        onBlur={(e) => handleConfigUpdate(`affiliate_level_${level.lv}_fee`, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiers Visuales / Umbrales */}
              {[
                { key: "tier_gold_min", label: "Referidos para Oro", desc: "Requisito visual para insignia Oro." },
                { key: "tier_diamond_min", label: "Referidos para Diamante", desc: "Requisito visual para insignia Diamante." },
              ].map((config) => (
                <div key={config.key} className="premium-card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <History className="w-5 h-5" /> {config.label}
                  </div>
                  <p className="text-xs text-muted">{config.desc}</p>
                  <input
                    type="number" step="1"
                    defaultValue={configs.find(c => c.key === config.key)?.value || 0}
                    className="w-full p-3 bg-background rounded-xl border border-surface-border text-lg font-bold"
                    onBlur={(e) => handleConfigUpdate(config.key, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>

            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-sm font-bold text-amber-500 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Nota de Seguridad
              </p>
              <p className="text-xs text-amber-500/80 mt-1">
                Los cambios en los porcentajes se aplicarán a todas las transacciones nuevas a partir de este momento. El historial de pagos anteriores no se modificará.
              </p>
            </div>

            {/* Gestión de Retiros (Admin) */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                <Wallet className="w-6 h-6" /> Gestión de Retiros Pendientes
              </h3>
              {adminWithdrawals.filter(w => w.status === 'pending').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminWithdrawals.filter(w => w.status === 'pending').map(w => (
                    <div key={w.id} className="premium-card p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-2xl font-black text-primary">${w.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted font-bold">Solicitado por ID: {w.owner_id}</p>
                          <p className="text-[10px] text-muted">{mounted ? new Date(w.created_at).toLocaleString() : '...'}</p>
                        </div>
                        <span className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold uppercase">Pendiente</span>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-surface-border">
                        <p className="text-[10px] font-black uppercase text-muted">Método & Detalles</p>
                        <p className="text-xs font-bold">{w.method}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{w.details}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcessWithdrawal(w.id, "completed")}
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleProcessWithdrawal(w.id, "rejected")}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center premium-card border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-sm font-bold text-emerald-500">No hay retiros pendientes por procesar. ✨</p>
                </div>
              )}
            </div>

            {/* Cola de Soporte (Admin) */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                <LifeBuoy className="w-6 h-6" /> Cola de Tickets de Soporte
              </h3>
              <div className="premium-card divide-y divide-surface-border overflow-hidden">
                {adminTickets.length > 0 ? adminTickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveTab("support");
                      handleOpenTicket(t.id, true);
                    }}
                    className="p-4 flex items-center justify-between hover:bg-background/50 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-bold text-sm">{t.subject}</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                        Usuario ID: {t.user_id} · {mounted ? new Date(t.created_at).toLocaleDateString() : '...'}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${t.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-surface-border text-muted border-surface-border'
                      }`}>
                      {t.status === 'open' ? 'Responder' : t.status === 'pending' ? 'En espera' : 'Cerrado'}
                    </span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-muted font-bold">No hay tickets hoy. Todo en orden.</div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "affiliates" && (
          <div className="space-y-10 animate-fade-in">
            <header>
              <h2 className="text-2xl font-bold tracking-tight">Programa de Embajadores</h2>
              <p className="text-muted font-medium">Invita a otros creadores de contenido y gana comisiones vitalicias.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="premium-card p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Tu Link de Referencia</h3>
                  <p className="text-sm text-muted">Comparte este link. Si alguien se registra, será tu referido de por vida.</p>
                </div>

                <div className="flex items-center gap-2 p-4 bg-background rounded-xl border border-surface-border group">
                  <code className="flex-1 text-sm font-mono text-primary truncate">
                    {mounted ? `${window.location.origin}/register?ref=${summary?.referral_code}` : '...'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/register?ref=${summary?.referral_code}`)}
                    className="p-2 hover:bg-surface-border rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-muted group-hover:text-primary" />
                  </button>
                </div>

                <div className="pt-4 border-t border-surface-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Tu Nivel Actual</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter border ${summary?.affiliate_tier === 'DIAMANTE' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                        summary?.affiliate_tier === 'ORO' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-orange-500/10 text-orange-500 border-orange-500/20'
                        }`}>
                        {summary?.affiliate_tier || 'BRONCE'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Comisión Actual</p>
                    <p className="text-xl font-bold text-emerald-500">
                      {summary?.affiliate_tier === 'DIAMANTE' ? '8%' : summary?.affiliate_tier === 'ORO' ? '5%' : '2%'}
                    </p>
                  </div>
                </div>

                {/* Progress bar for next tier */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>{summary?.affiliate_next_tier_min ? 'Progreso al siguiente nivel' : '¡Nivel Máximo alcanzado!'}</span>
                    {summary?.affiliate_next_tier_min && (
                      <span>{summary?.referral_count || 0} / {summary?.affiliate_next_tier_min}</span>
                    )}
                  </div>
                  {summary?.affiliate_next_tier_min && (
                    <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((summary?.referral_count || 0) / summary?.affiliate_next_tier_min) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="premium-card p-8 bg-primary/5 border-primary/20 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">Balance de Afiliado</h3>
                    <p className="text-xs text-primary font-bold">Ganado por recomendar el sistema</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                </div>

                <div className="py-2">
                  <h4 className="text-4xl font-black tracking-tighter text-primary">
                    ${(summary?.affiliate_balance || 0).toFixed(2)}
                  </h4>
                </div>

                <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Transferir a Billereta Principal
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-10 animate-fade-in">
            <header>
              <h2 className="text-2xl font-bold tracking-tight">Perfil & Configuración</h2>
              <p className="text-muted font-medium">Gestiona tu identidad y seguridad en la plataforma.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Profile Settings */}
              <div className="premium-card p-8 space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <UserCircle className="w-6 h-6" /> Información Personal
                </h3>

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={summary?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + summary?.email}
                      alt="Avatar"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20"
                    />
                    <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:scale-105 transition-all">
                      <PenTool className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-xl">{summary?.full_name}</p>
                    <p className="text-sm text-muted font-medium">{summary?.email}</p>
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded">ID: {summary?.id}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Nombre Completo</label>
                    <input
                      id="profile_name"
                      type="text"
                      defaultValue={summary?.full_name}
                      className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">URL del Avatar (Opcional)</label>
                    <input
                      id="profile_avatar"
                      type="text"
                      defaultValue={summary?.avatar_url}
                      placeholder="https://tu-imagen.com/foto.jpg"
                      className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-medium"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const name = (document.getElementById('profile_name') as HTMLInputElement).value;
                      const avatar = (document.getElementById('profile_avatar') as HTMLInputElement).value;
                      handleUpdateProfile(name, avatar);
                    }}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Guardar Cambios de Perfil
                  </button>
                </div>
              </div>

              {/* Password Settings */}
              <div className="premium-card p-8 space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Lock className="w-6 h-6" /> Seguridad & Contraseña
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Contraseña Actual</label>
                    <input
                      id="pass_current"
                      type="password"
                      className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Nueva Contraseña</label>
                    <input
                      id="pass_new"
                      type="password"
                      className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Confirmar Nueva Contraseña</label>
                    <input
                      id="pass_confirm"
                      type="password"
                      className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-medium"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const current = (document.getElementById('pass_current') as HTMLInputElement).value;
                      const next = (document.getElementById('pass_new') as HTMLInputElement).value;
                      const confirm = (document.getElementById('pass_confirm') as HTMLInputElement).value;

                      if (next !== confirm) return alert("Las contraseñas no coinciden");
                      handleUpdatePassword(current, next);
                    }}
                    className="w-full py-4 bg-surface-border text-foreground border border-surface-border rounded-xl font-bold hover:bg-surface-border/50 transition-all"
                  >
                    Actualizar Contraseña
                  </button>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-500">Autenticación Protegida</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Tus datos están encriptados con estándares bancarios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin_payments" && (
          <div className="space-y-10 animate-fade-in">
            <header>
              <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                <CreditCard className="w-8 h-8" /> Validación de Pagos Manuales (Crypto)
              </h2>
              <p className="text-muted font-medium">Revisa y aprueba transacciones de criptomonedas recibidas.</p>
            </header>

            <div className="space-y-6">
              <h3 className="text-xl font-bold">Pagos Pendientes de Verificación</h3>
              {adminPayments.filter(p => p.status === 'pending').length > 0 ? (
                <div className="premium-card overflow-hidden text-left">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-background/50 text-[10px] font-black uppercase tracking-widest text-muted border-b border-surface-border">
                        <th className="p-5">ID / Fecha</th>
                        <th className="p-5">Usuario ID</th>
                        <th className="p-5">Monto</th>
                        <th className="p-5">Referencia</th>
                        <th className="p-5">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {adminPayments.filter(p => p.status === 'pending').map(p => (
                        <tr key={p.id} className="hover:bg-background/30 transition-colors">
                          <td className="p-5">
                            <p className="font-bold text-sm">#{p.id}</p>
                            <p className="text-[10px] text-muted">{mounted ? new Date(p.created_at).toLocaleString() : '...'}</p>
                          </td>
                          <td className="p-5">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">U-{p.user_id}</span>
                          </td>
                          <td className="p-5">
                            <p className="font-black text-emerald-500">${p.amount.toFixed(2)} USDT</p>
                          </td>
                          <td className="p-5">
                            <code className="text-[10px] font-mono bg-background p-1 rounded border border-surface-border">{p.reference}</code>
                          </td>
                          <td className="p-5">
                            <button
                              onClick={() => handleVerifyCrypto(p.id)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:scale-105 transition-all shadow-md shadow-primary/10"
                            >
                              Verificar & Activar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center premium-card border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-bold text-emerald-500">No hay pagos de criptomonedas pendientes. ✨</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl text-left">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Flujo de Control
              </h4>
              <p className="text-xs text-muted font-medium leading-relaxed">
                1. El usuario envía el pago y abre un ticket con su Hash de transacción.<br />
                2. Verifica el hash en el explorador de bloques de la red correspondiente (ej: TRONSCAN para TRC20).<br />
                3. Busca el ID de pago o monto en esta tabla.<br />
                4. Haz clic en "Verificar" para activar la membresía, distribuir los fondos MLM y notificar al usuario.
              </p>
            </div>
          </div>
        )}

        <footer className="pt-10 border-t border-surface-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sistema Seguro & Encriptado
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5 underline decoration-primary/30">
              <History className="w-3.5 h-3.5" /> Historial de Pagos
            </a>
            <span className="text-xs font-bold text-muted">v2.4.0 SaaS Edition</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
