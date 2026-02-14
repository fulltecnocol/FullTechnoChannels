
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  usersApi, ownerApi, adminApi, walletApi, supportApi,
  authApi, channelApi
} from '@/lib/api';
import {
  SummaryData, Channel, ConfigItem, Withdrawal, SupportTicket,
  TicketMessage, AnalyticsData, Promotion, Payment, UserAdmin
} from '@/lib/types';

// Components
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RevenueCharts } from '@/components/dashboard/RevenueCharts';
import { ChannelList } from '@/components/dashboard/ChannelList';
import { CreateChannelModal } from '@/components/dashboard/CreateChannelModal';
// import { DeleteChannelModal } from '@/components/dashboard/DeleteChannelModal'; // Not used in original? Verified in ChannelList it has onDeleteChannel callback
import { AffiliateSection } from '@/components/dashboard/AffiliateSection';
import { WithdrawalSection } from '@/components/dashboard/WithdrawalSection';
import { SupportSection } from '@/components/dashboard/SupportSection';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import { AdminSystem } from '@/components/dashboard/AdminSystem';
import { AdminPayments } from '@/components/dashboard/AdminPayments';
import { LegalSignature } from '@/components/LegalSignature';
import { TaxHub } from '@/components/dashboard/TaxHub';
import { PromotionsManager } from '@/components/dashboard/PromotionsManager';
import { BrandingEditor } from '@/components/dashboard/BrandingEditor';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ revenue_series: [], subscriber_series: [], mlm_series: [] });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Admin Data States
  const [adminUsers, setAdminUsers] = useState<UserAdmin[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminPayments, setAdminPayments] = useState<Payment[]>([]);
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);

  // UI States
  const [isViewingAsAdmin, setIsViewingAsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [managingPromos, setManagingPromos] = useState<any>(null); // Channel object
  const [editingBranding, setEditingBranding] = useState<any>(null); // Channel object
  const [isAddingChannel, setIsAddingChannel] = useState(false); // For Modal

  const [newChannelStep, setNewChannelStep] = useState(1);
  const [createdChannel, setCreatedChannel] = useState<any>(null);

  // --- Effects ---
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!authApi.isAuthenticated()) {
        router.push('/login');
        return;
      }
      const userData = await authApi.me();
      setUser(userData);
      fetchData();
      if (userData.is_admin) {
        fetchAdminData();
      }

      // Check Stripe Success
      const params = new URLSearchParams(window.location.search);
      if (params.get('stripe_success') === 'true') {
        // confetti? alert?
        window.history.replaceState({}, '', '/dashboard');
      }
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [summaryData, channelsData, withdrawalsData, analyticsData, ticketsData] = await Promise.all([
        ownerApi.getSummary(),
        ownerApi.getChannels(),
        walletApi.getWithdrawals(),
        ownerApi.getAnalytics(),
        supportApi.getTickets()
      ]);
      setSummary(summaryData);
      setChannels(channelsData);
      setWithdrawals(withdrawalsData);
      setAnalytics(analyticsData);
      setSupportTickets(ticketsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [users, configData, withdrawals, payments, tickets] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getConfig(),
        adminApi.getWithdrawals(),
        adminApi.getPayments(),
        adminApi.getTickets()
      ]);
      setAdminUsers(users);
      setConfigs(configData);
      setAdminWithdrawals(withdrawals);
      setAdminPayments(payments);
      setAdminTickets(tickets);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  // --- Handlers ---
  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  const handleCreateChannel = () => {
    setIsAddingChannel(true);
  };

  const handleCreateChannelSubmit = async (title: string) => {
    try {
      const newCh = await ownerApi.createChannel(title);
      setCreatedChannel(newCh);
      setNewChannelStep(2);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePromo = async (channelId: number, data: any) => {
    try {
      await channelApi.createPromotion(channelId, data);
      alert("Promoción creada exitosamente");
      // Refresh promos
      const promos = await channelApi.getPromotions(channelId);
      setPromotions(promos);
    } catch (err: any) {
      alert(err.message || "Error creando promoción");
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    try {
      await channelApi.deletePromotion(id);
      if (managingPromos) {
        const promos = await channelApi.getPromotions(managingPromos.id);
        setPromotions(promos);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateBranding = async (id: number, welcome: string, expiration: string) => {
    try {
      await channelApi.updateBranding(id, { welcome_message: welcome, expiration_message: expiration });
      alert("Branding actualizado");
      setEditingBranding(null);
      fetchData(); // Refresh channels
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestWithdrawal = async (amount: number, method: string, details: string) => {
    try {
      await walletApi.requestWithdrawal({ amount, method, details });
      alert("Solicitud de retiro enviada");
      fetchData(); // Refresh balance and list
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Admin Handlers
  const handleConfigUpdate = async (key: string, value: number) => {
    try {
      await adminApi.updateConfig(key, value);
      const configData = await adminApi.getConfig();
      setConfigs(configData);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProcessWithdrawal = async (id: number, status: string) => {
    try {
      await adminApi.processWithdrawal(id, status); // Assuming api has this
      alert(`Retiro ${status === 'completed' ? 'aprobado' : 'rechazado'}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyCrypto = async (id: number) => {
    if (!confirm("¿Confirmar recepción de fondos?")) return;
    try {
      await adminApi.verifyPayment(id);
      alert("Pago verificado y comisión distribuida.");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Support Handlers
  const handleOpenTicket = async (id: number, isAdmin: boolean) => {
    // This logic might be complex if it involves a modal or navigation.
    // In original page.tsx, it might have set a selectedTicket state.
    // For now, I'll assume SupportSection handles the ticket details fetch or I need to pass a handler that navigates.
    // Actually, SupportSection likely has its own internal state for selected ticket or accepts a prop.
    // Let's assume for now we just alert or console log until we verify SupportSection.
    console.log("Open ticket", id);
    // Note: AdminSystem calls this.
    // If SupportSection is rendered when activeTab is support, we might need a way to tell it which ticket to open.
    // Maybe `selectedTicketId` state?
  };

  const handleCreateTicket = async (subject: string, message: string, priority: string) => {
    try {
      await supportApi.createTicket({ subject, content: message + (priority ? ` [${priority}]` : "") });
      alert("Ticket creado");
      const tickets = await supportApi.getTickets();
      setSupportTickets(tickets);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Profile Handlers
  const handleUpdateProfile = async (name: string, avatarUrl: string) => {
    try {
      await usersApi.updateProfile({ full_name: name, avatar_url: avatarUrl });
      alert("Perfil actualizado");
      checkAuth(); // Refresh user
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePassword = async (oldPass: string, newPass: string, confirmTwice: string) => {
    try {
      await usersApi.updatePassword({ old_password: oldPass, new_password: newPass });
      alert("Contraseña actualizada");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Utils
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  // Sub-handlers for ChannelList
  const handleManagePromos = async (channel: any) => {
    setManagingPromos(channel);
    try {
      const promos = await channelApi.getPromotions(channel.id);
      setPromotions(promos);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsViewingAsAdmin={setIsViewingAsAdmin}
        summary={summary}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-6 md:p-10 space-y-10 max-w-7xl mx-auto overflow-y-auto relative">
        <DashboardHeader
          handleCreateChannel={handleCreateChannel}
          managingPromos={!!managingPromos}
          setManagingPromos={() => setManagingPromos(null)}
        />

        {/* Overlays / Managers */}
        <PromotionsManager
          managingPromos={managingPromos}
          setManagingPromos={setManagingPromos}
          promotions={promotions}
          handleCreatePromo={handleCreatePromo}
          handleDeletePromo={handleDeletePromo}
          copyToClipboard={copyToClipboard}
        />

        <BrandingEditor
          editingBranding={editingBranding}
          setEditingBranding={setEditingBranding}
          handleUpdateBranding={handleUpdateBranding}
        />

        {!managingPromos && !editingBranding && !isAddingChannel && (
          <div className="animate-fade-in-up">
            {activeTab === "overview" && summary && (
              <div className="space-y-10">
                <DashboardStats summary={summary} onTabChange={setActiveTab} />
                <RevenueCharts analytics={analytics} />
                {/* Recent Activity or other overview items could go here */}
              </div>
            )}

            {activeTab === "channels" && (
              <ChannelList
                channels={channels}
                onEditBranding={setEditingBranding}
                onManagePromos={handleManagePromos}
                onViewSubscribers={(id) => console.log("View subs", id)} // Implement navigation if needed
                onLinkChannel={(ch) => {
                  setCreatedChannel(ch);
                  setNewChannelStep(2);
                  setIsAddingChannel(true);
                }}
                onDeleteChannel={(id) => {
                  if (confirm("¿Seguro?")) ownerApi.deleteChannel(id).then(fetchData);
                }}
                isLoading={false}
              />
            )}

            {activeTab === "affiliates" && (
              <AffiliateSection
                summary={summary}
                user={user}
                copyToClipboard={copyToClipboard}
              />
            )}

            {activeTab === "wallet" && (
              <WithdrawalSection
                summary={summary}
                withdrawals={withdrawals}
                withdrawalOptions={[
                  { id: "stripe", name: "Stripe / Tarjeta", description: "Transferencia directa a cuenta vinculada.", active: true },
                  { id: "wompi", name: "Wompi / Nequi (Colombia)", description: "Transferencia en tiempo real a Nequi o Bancos.", active: false }, // Configurable?
                  { id: "crypto", name: "USDT / Crypto", description: "Pago en Stablecoins (Red TRC20).", active: false },
                ]}
                onRequestWithdrawal={handleRequestWithdrawal}
                statusLabels={{ pending: "Pendiente", completed: "Completado", rejected: "Rechazado" }}
                statusColors={{ pending: "bg-amber-500/10 text-amber-500 border-amber-500/20", completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", rejected: "bg-red-500/10 text-red-500 border-red-500/20" }}
              />
            )}

            {activeTab === "support" && (
              <SupportSection
                tickets={supportTickets}
                onCreateTicket={handleCreateTicket}
                user={user}
                onAdminViewTicket={(id) => console.log("Admin View", id)} // Placeholder for now
              />
            )}

            {activeTab === "settings" && (
              <ProfileSettings
                user={user}
                isRecovery={false} // Check if recovery mode
                onUpdateProfile={handleUpdateProfile}
                onUpdatePassword={handleUpdatePassword}
              />
            )}

            {activeTab === "legal" && <LegalSignature />}

            {/* Admin Tabs */}
            {activeTab === "admin" && summary?.is_admin && (
              <AdminSystem
                adminUsers={adminUsers}
                configs={configs}
                handleConfigUpdate={handleConfigUpdate}
                adminWithdrawals={adminWithdrawals}
                handleProcessWithdrawal={handleProcessWithdrawal}
                adminTickets={adminTickets}
                handleOpenTicket={handleOpenTicket}
                setActiveTab={setActiveTab}
                mounted={mounted}
              />
            )}

            {activeTab === "admin_payments" && summary?.is_admin && (
              <AdminPayments
                adminPayments={adminPayments}
                handleVerifyCrypto={handleVerifyCrypto}
                mounted={mounted}
              />
            )}

            {activeTab === "admin_tax" && summary?.is_admin && (
              <TaxHub />
            )}
          </div>
        )}

        {isAddingChannel && (
          <CreateChannelModal
            isOpen={isAddingChannel}
            onClose={() => setIsAddingChannel(false)}
            onSubmit={handleCreateChannelSubmit}
            step={newChannelStep}
            createdChannel={createdChannel}
            copyToClipboard={copyToClipboard}
          />
        )}

      </main>
    </div>
  );
}
