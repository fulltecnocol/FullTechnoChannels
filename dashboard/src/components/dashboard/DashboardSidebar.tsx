
import { Bot, LayoutGrid, Users, Zap, LifeBuoy, ShieldCheck, Wallet, Settings, ShieldEllipsis, CreditCard, LogOut } from 'lucide-react';
import { SummaryData } from '@/lib/types';

interface DashboardSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setIsViewingAsAdmin: (isAdmin: boolean) => void;
    summary: SummaryData | null;
    handleLogout: () => void;
}

export function DashboardSidebar({ activeTab, setActiveTab, setIsViewingAsAdmin, summary, handleLogout }: DashboardSidebarProps) {
    const menuItems = [
        { id: "overview", label: "Vista General", icon: LayoutGrid },
        { id: "channels", label: "Mis Canales", icon: Users },
        { id: "affiliates", label: "Afiliados", icon: Zap },
        { id: "support", label: "Soporte", icon: LifeBuoy },
        { id: "legal", label: "Identidad Legal", icon: ShieldCheck },
        { id: "wallet", label: "Billetera", icon: Wallet },
        { id: "settings", label: "Configuración", icon: Settings },
        ...(summary?.is_admin ? [
            { id: "admin", label: "Admin Sistema", icon: ShieldEllipsis },
            { id: "admin_payments", label: "Admin Pagos", icon: CreditCard }
        ] : []),
    ];

    return (
        <aside className="hidden md:flex w-72 flex-col border-r border-surface-border bg-surface/50 backdrop-blur-xl p-8 space-y-10 h-screen sticky top-0">
            <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent-gold to-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:rotate-12 transition-all">
                    <Bot className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-xl tracking-tighter text-white leading-none">Tele<span className="text-primary">Gate</span></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">Premium Core</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            setIsViewingAsAdmin(item.id.startsWith("admin"));
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
    );
}
