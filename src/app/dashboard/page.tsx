"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Wallet, TrendingUp, LayoutGrid, Settings, LogOut,
  Menu, X, PlusCircle, Ticket, Zap, LifeBuoy, ShieldEllipsis, CreditCard,
  Copy, Trash2, CheckCircle2, AlertCircle, ArrowRight, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ownerApi, adminApi } from "@/lib/api";

// Import new components
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ChannelList } from "@/components/dashboard/ChannelList";
import { CreateChannelModal } from "@/components/dashboard/CreateChannelModal";
import { WithdrawalSection } from "@/components/dashboard/WithdrawalSection";
import { SupportSection } from "@/components/dashboard/SupportSection";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { AdminPaymentValidation } from "@/components/dashboard/AdminPaymentValidation";
import { AffiliateSection } from "@/components/dashboard/AffiliateSection";

export default function DashboardPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]); // Para el admin
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isViewingAsAdmin, setIsViewingAsAdmin] = useState(false);

  // States for modals and forms (manage via parents)
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [editingBranding, setEditingBranding] = useState<any>(null);
  const [managingPromos, setManagingPromos] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Wizard state for new channel
  const [newChannelStep, setNewChannelStep] = useState(1);
  const [createdChannel, setCreatedChannel] = useState<any>(null);

  // Other specific states matching new components requirements
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Recovery mode check (if needed)
  const isRecovery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('recovery') === 'true' : false;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchData();
    }

    if (isRecovery) setActiveTab('settings');
  }, []);

  const fetchData = async (background = false) => {
    try {
      if (!background) setLoading(true); // Don't show loader if background update

      const [channelsData, summaryData] = await Promise.all([
        ownerApi.getChannels(),
        ownerApi.getSummary(),
      ]);

      setChannels(channelsData);
      setSummary(summaryData);
      setUser(summaryData); // summaryData acts as user profile source based on types.ts

      // Admin Data Fetching
      if (summaryData?.is_admin) {
        try {
          const pending = await adminApi.getPendingPayments();
          setPendingPayments(pending || []);
        } catch (e) {
          console.error("Error fetching admin payments", e);
        }
      }

      // Fetch other tab-specific data if needed, or fetch lazily
      if (activeTab === 'wallet') loadWithdrawals();
      if (activeTab === 'support') loadTickets();

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Only redirect on auth error, not connection error
      // if (err.message.includes("401")) router.push("/login");
    } finally {
      if (!background) setLoading(false);
    }
  };

  // Lazy loaders
  const loadWithdrawals = async () => {
    try {
      const data = await ownerApi.getWithdrawals();
      setWithdrawals(data);
    } catch (e) { console.error(e) }
  };

  const loadTickets = async () => {
    try {
      const data = await ownerApi.getTickets();
      setTickets(data);
    } catch (e) { console.error(e) }
  };

  // Needed for "Manage Promos" in ChannelList.tsx (Currently simpler logic there)
  // We need to implement handleLoadPromos as well
  const handleLoadPromos = async (channelId: string) => {
    try {
      const promos = await ownerApi.getPromotions(Number(channelId));
      setPromotions(promos);
    } catch (e) { console.error(e) }
  };

  useEffect(() => {
    if (activeTab === 'wallet') loadWithdrawals();
    if (activeTab === 'support') loadTickets();
  }, [activeTab]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleCreateChannel = () => {
    setIsAddingChannel(true);
    setNewChannelStep(1);
    setCreatedChannel(null);
  };

  // Wrappers for component actions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
    alert("Copiado al portapapeles: " + text);
  };

  const statusLabels: any = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", paid: "Pagado" };
  const statusColors: any = { pending: "bg-amber-500/10 text-amber-500 border-amber-500/20", approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", rejected: "bg-red-500/10 text-red-500 border-red-500/20", paid: "bg-blue-500/10 text-blue-500 border-blue-500/20" };

  const withdrawalOptions = [
    { id: "stripe", name: "Stripe / Tarjeta", description: "Transferencia directa a cuenta vinculada.", active: true },
    { id: "wompi", name: "Wompi / Nequi (Colombia)", description: "Transferencia en tiempo real a Nequi o Bancos.", active: false },
    { id: "crypto", name: "USDT / Crypto", description: "Pago en Stablecoins (Red TRC20).", active: false },
  ];

  /* --- Handlers --- */

  const submitCreateChannel = async (title: string) => {
    try {
      const channel = await ownerApi.createChannel(title);
      setCreatedChannel(channel);
      setNewChannelStep(2);
      fetchData(true); // Background update
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (name: string, avatarUrl: string) => {
    try {
      await ownerApi.updateProfile({ full_name: name, avatar_url: avatarUrl });
      alert("Perfil actualizado correctamente");
      fetchData(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdatePassword = async (oldPass: string, newPass: string, confirmTwice: string) => {
    try {
      // Logic usually handled in API, assuming endpoint exists or handled via specialized call
      // current api might not support this directly in `updateProfile`, checking api...
      // If no explicit endpoint, we might skip implementation or assume it's part of updateProfile if supported.
      // For now, placeholder:
      alert("Cambio de contraseña simulado (API pendiente)");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRequestWithdrawal = async (amount: number, method: string, details: string) => {
    try {
      await ownerApi.requestWithdrawal({ amount, method, details });
      alert("Solicitud de retiro enviada");
      loadWithdrawals();
      fetchData(true); // Update balance
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleValidatePayment = async (paymentId: string, isValid: boolean) => {
    try {
      if (isValid) {
        await adminApi.verifyCryptoPayment(parseInt(paymentId));
        alert("Pago aprobado");
      } else {
        alert("Rechazo de pago no soporta API aún (simulado)");
        // await adminApi.rejectPayment(parseInt(paymentId));
      }
      const pending = await adminApi.getPendingPayments();
      setPendingPayments(pending || []);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveBranding = async () => {
    if (!editingBranding) return;
    try {
      await ownerApi.updateBranding(Number(editingBranding.id), {
        welcome_message: (document.getElementById('b_welcome') as HTMLInputElement).value,
        expiration_message: "", // Add missing prop if required by type
      });
      // logo_url is not in updateBranding type in api.ts?
      // api.ts: updateBranding: (channelId, data: { welcome_message, expiration_message })
      // UI has welcome_message and logo_url.
      // It seems api.ts definition might be missing logo_url or backend doesn't support it there.
      // I will stick to what api.ts says: welcome_message.
      alert("Branding actualizado");
      setEditingBranding(null);
      fetchData(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Promo handlers
  const handleCreatePromo = async (channelId: string, data: any) => {
    try {
      await ownerApi.createPromotion(Number(channelId), data);
      alert("Promoción creada");
      handleLoadPromos(channelId);
    } catch (e: any) { alert(e.message) }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm("⚠️ ¿Estás seguro de que quieres eliminar este canal?\n\nEsta acción no se puede deshacer. Se perderán las configuraciones y afiliados asociados.\n\nNota: Si tienes suscriptores activos, no podrás eliminarlo.")) return;

    try {
      await ownerApi.deleteChannel(channelId);
      alert("Canal eliminado correctamente");
      fetchData(true);
    } catch (e: any) {
      alert(e.message || "Error al eliminar el canal");
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!confirm("¿Eliminar promoción?")) return;
    try {
      await ownerApi.deletePromotion(Number(promoId));
      if (managingPromos) handleLoadPromos(managingPromos.id);
    } catch (e: any) { alert(e.message) }
  };


  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted font-bold animate-pulse">Cargando TeleGate...</p>
      </div>
    );
  }

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

        {/* --- DYNAMIC CONTENT BASED ON TABS --- */}

        {activeTab === "overview" && (
          <>
            <DashboardStats summary={summary} />

            {/* Recent Activity / Chart could go here, for now basic list */}
            <div className="premium-card p-8 border-surface-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Rendimiento Mensual
                </h3>
                <select className="bg-surface border border-surface-border rounded-lg text-xs font-bold p-2 outline-none">
                  <option>Últimos 30 días</option>
                  <option>Este Año</option>
                </select>
              </div>
              <div className="h-[300px] w-full bg-surface/30 rounded-xl flex items-center justify-center border border-dashed border-surface-border">
                <p className="text-muted font-bold text-sm">Gráfico de ingresos en tiempo real (Próximamente)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Canales Recientes</h3>
              <ChannelList
                channels={channels.slice(0, 3)}
                isLoading={false}
                onEditBranding={setEditingBranding}
                onManagePromos={(ch) => {
                  setManagingPromos(ch);
                  handleLoadPromos(ch.id);
                }}
                onLinkChannel={(channel) => {
                  setCreatedChannel(channel);
                  setNewChannelStep(2);
                  setIsAddingChannel(true);
                }}
                onDeleteChannel={handleDeleteChannel}
                onViewSubscribers={(id) => router.push(`/dashboard/channel/${id}`)}
              />
              {channels.length > 3 && (
                <button onClick={() => setActiveTab('channels')} className="w-full py-3 text-sm font-bold text-muted hover:text-primary transition-colors">
                  Ver todos los canales ({channels.length})
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === "channels" && (
          <ChannelList
            channels={channels}
            isLoading={loading} // loading handled by global state essentially
            onEditBranding={setEditingBranding}
            onManagePromos={(ch) => {
              setManagingPromos(ch);
              handleLoadPromos(ch.id);
            }}
            onLinkChannel={(channel) => {
              setCreatedChannel(channel);
              setNewChannelStep(2);
              setIsAddingChannel(true);
            }}
            onDeleteChannel={handleDeleteChannel}
            onViewSubscribers={(id) => router.push(`/dashboard/channel/${id}`)}
          />
        )}

        {activeTab === "wallet" && (
          <WithdrawalSection
            summary={summary}
            withdrawals={withdrawals}
            withdrawalOptions={withdrawalOptions}
            onRequestWithdrawal={handleRequestWithdrawal}
            statusLabels={statusLabels}
            statusColors={statusColors}
          />
        )}

        {activeTab === "support" && (
          <SupportSection
            tickets={tickets}
            isAdmin={summary?.is_admin}
            onAdminViewTicket={(id) => alert(`Ver Ticket ${id} (Pendiente impl)`)}
          />
        )}

        {activeTab === "settings" && (
          <ProfileSettings
            user={user}
            isRecovery={isRecovery}
            onUpdateProfile={handleUpdateProfile}
            onUpdatePassword={handleUpdatePassword}
          />
        )}

        {activeTab === "affiliates" && (
          <AffiliateSection
            user={user}
            summary={summary}
            copyToClipboard={copyToClipboard}
          />
        )}

        {activeTab === "admin_payments" && summary?.is_admin && (
          <AdminPaymentValidation
            pendingPayments={pendingPayments}
            onValidatePayment={handleValidatePayment}
          />
        )}

        {/* Footer */}
        <footer className="pt-10 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-muted">
            &copy; 2024 TeleGate Inc. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-muted hover:text-primary transition-colors"> Términos </a>
            <a href="#" className="text-xs font-bold text-muted hover:text-primary transition-colors"> Privacidad </a>
            <a href="#" className="text-xs font-bold text-muted hover:text-primary transition-colors"> Soporte </a>
            <span className="text-xs font-bold text-muted">v2.4.0 SaaS Edition</span>
          </div>
        </footer>
      </main>

      {/* --- MODALS --- */}

      {/* Create Channel Modal - Now isolated */}
      <CreateChannelModal
        isOpen={isAddingChannel}
        onClose={() => setIsAddingChannel(false)}
        onSubmit={submitCreateChannel}
        step={newChannelStep}
        createdChannel={createdChannel}
        copyToClipboard={copyToClipboard}
      />

      {/* Branding Modal (Legacy - Keep local or extract later? Keeping local for now as it's simple enough) */}
      {editingBranding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xl premium-card p-10 space-y-6 animate-in zoom-in-95 shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-tight">Personalizar Branding</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted uppercase">Mensaje de Bienvenida</label>
                <input id="b_welcome" type="text" defaultValue={editingBranding.welcome_message} className="w-full p-3 bg-background border border-surface-border rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase">URL Logo</label>
                <input id="b_logo" type="text" defaultValue={editingBranding.logo_url} className="w-full p-3 bg-background border border-surface-border rounded-xl font-bold" />
              </div>
              <button onClick={handleSaveBranding} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold">Guardar Personalización</button>
              <button onClick={() => setEditingBranding(null)} className="w-full py-3 text-muted font-bold hover:text-foreground">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Promotions Modal (Legacy - Could be extracted but left here for now) */}
      {managingPromos && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-4xl premium-card p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl border-primary/20 relative">
            <header className="flex items-center justify-between border-b border-surface-border pb-6">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 text-amber-500">
                  <Ticket className="w-8 h-8" /> Promociones: {managingPromos.title}
                </h2>
              </div>
              <button onClick={() => setManagingPromos(null)} className="px-4 py-2 font-bold text-muted hover:text-primary">Cerrar</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Create Promo Form */}
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 bg-background rounded-2xl border border-surface-border space-y-4">
                  <h3 className="font-bold text-sm uppercase text-primary">Nueva Oferta</h3>
                  <div className="space-y-2">
                    <input id="p_code" placeholder="CÓDIGO (EJ: VERANO)" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold uppercase outline-none focus:ring-1 ring-amber-500" />
                    <select id="p_type" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500">
                      <option value="discount">Descuento (%)</option>
                      <option value="trial">Prueba Gratis (Días)</option>
                    </select>
                    <input id="p_value" type="number" step="0.01" placeholder="Valor (Ej: 0.5 o 7)" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold" />
                    <input id="p_max" type="number" placeholder="Límite Usos" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold" />
                  </div>
                  <button
                    onClick={() => {
                      const code = (document.getElementById('p_code') as HTMLInputElement).value;
                      const type = (document.getElementById('p_type') as HTMLSelectElement).value;
                      const value = parseFloat((document.getElementById('p_value') as HTMLInputElement).value);
                      const max = (document.getElementById('p_max') as HTMLInputElement).value;
                      if (!code || !value) return alert("Completa los campos");
                      handleCreatePromo(managingPromos.id, { code, promo_type: type, value, max_uses: max ? parseInt(max) : null });
                    }}
                    className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all"
                  >
                    Crear Link
                  </button>
                </div>
              </div>

              {/* Promo List */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="font-bold text-sm uppercase text-primary">Activos</h3>
                <div className="space-y-2">
                  {promotions.length > 0 ? promotions.map(p => (
                    <div key={p.id} className="p-4 border border-surface-border rounded-xl flex items-center justify-between hover:bg-surface/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-amber-500">{p.code}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border font-black uppercase">{p.promo_type}</span>
                        </div>
                        <p className="text-xs text-muted font-bold">Usos: {p.current_uses} / {p.max_uses || '∞'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(`https://t.me/FullT_GuardBot?start=${p.code}`)} className="p-2 text-muted hover:text-primary"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePromo(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted font-bold p-10">Sin promociones activas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
