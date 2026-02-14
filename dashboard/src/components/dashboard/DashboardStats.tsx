import { Users, Wallet, TrendingUp, LayoutGrid, Calculator } from 'lucide-react';

interface DashboardStatsProps {
    summary: any;
    onTabChange?: (tab: string) => void;
}

export function DashboardStats({ summary, onTabChange }: DashboardStatsProps) {
    const stats = [
        { label: "Mis Suscriptores", value: summary?.active_subscribers || "0", change: "En tiempo real", icon: Users, color: "text-emerald-500", tab: "channels" },
        { label: "Balance Disponible", value: `$${(summary?.available_balance || 0).toFixed(2)}`, change: "De tus canales", icon: Wallet, color: "text-blue-500", tab: "wallet" },
        { label: "Ganancia Afiliados", value: `$${(summary?.affiliate_balance || 0).toFixed(2)}`, change: "Vitalicia", icon: TrendingUp, color: "text-amber-500", tab: "affiliates" },
        { label: "Canales Activos", value: summary?.active_channels || "0", change: "OK", icon: LayoutGrid, color: "text-emerald-400", tab: "channels" },
        ...(summary?.is_admin ? [
            { label: "Tax & Compliance", value: "Tax Hub", change: "Admin Only", icon: Calculator, color: "text-primary", tab: "admin_tax" }
        ] : []),
    ];

    // Note: We need to import Calculator if used.
    // DashboardStats doesn't have setActiveTab, but we can pass it if we want to make cards clickable.
    // For now, let's just show it.

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    onClick={() => onTabChange && stat.tab && onTabChange(stat.tab)}
                    className={`premium-card p-6 border-surface-border bg-gradient-to-br from-surface to-background relative overflow-hidden group hover:scale-[1.02] transition-transform ${stat.tab ? 'cursor-pointer' : ''}`}
                >
                    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                        <stat.icon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className={`p-3 w-fit rounded-xl bg-surface mb-4 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
                        <p className="text-[10px] font-bold text-muted mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {stat.change}
                        </p>
                    </div>
                </div>
            ))}
        </section>
    );
}
