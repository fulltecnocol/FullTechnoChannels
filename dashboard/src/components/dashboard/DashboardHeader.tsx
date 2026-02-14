
import { Plus, Gift, Bell } from 'lucide-react';

interface DashboardHeaderProps {
    handleCreateChannel: () => void;
    managingPromos: boolean;
    setManagingPromos: (value: boolean) => void;
}

export function DashboardHeader({ handleCreateChannel, managingPromos, setManagingPromos }: DashboardHeaderProps) {

    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-surface-border/50 animate-fade-in-down">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                    Panel de <span className="text-primary italic">Control</span>
                </h1>
                <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Gestión automatizada de comunidades.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-surface/50 border border-surface-border rounded-xl">
                    <span className="text-xs font-bold text-muted">Servidor: Centra-1</span>
                </div>
                <button
                    onClick={handleCreateChannel}
                    className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-[0.95] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Nuevo Canal VIP</span>
                </button>
            </div>
        </header>
    );
}
