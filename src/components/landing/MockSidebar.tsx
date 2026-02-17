
import { LayoutGrid, Users, Zap, Wallet, Settings } from "lucide-react";

export function MockSidebar() {
    return (
        <div className="w-full h-full flex flex-col border-r border-surface-border bg-surface p-4 space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-sm">T</div>
                <span className="font-bold text-lg tracking-tight text-white">FGate</span>
            </div>

            <div className="flex-1 space-y-1">
                {[
                    { icon: LayoutGrid, label: "Vista General", active: true },
                    { icon: Users, label: "Mis Canales", active: false },
                    { icon: Zap, label: "Afiliados", active: false },
                    { icon: Wallet, label: "Billetera", active: false },
                    { icon: Settings, label: "Configuración", active: false },
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg text-xs font-bold ${item.active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted/50"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </div>
                ))}
            </div>

            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-bold text-primary flex items-center justify-center gap-2">
                <Zap className="w-3 h-3" /> Plan Pro
            </div>
        </div>
    );
}
