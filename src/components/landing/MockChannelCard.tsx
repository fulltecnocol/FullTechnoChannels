
import { Ticket, Palette, CheckCircle2 } from "lucide-react";

export function MockChannelCard() {
    return (
        <div className="w-full bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-4 shadow-lg animate-pulse-slow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent-gold flex items-center justify-center font-bold text-black shadow-lg shadow-primary/20 shrink-0">
                VIP
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-white truncate">Canal VIP Premium</p>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted font-black uppercase tracking-widest bg-surface-border/50 px-1.5 py-0.5 rounded">
                        CODE: TELE-888
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Ticket className="w-4 h-4" />
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Palette className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
