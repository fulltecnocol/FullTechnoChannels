import { Zap, Copy, Trophy, Target, ArrowUpRight } from 'lucide-react';

interface AffiliateSectionProps {
    user: any;
    summary: any;
    copyToClipboard: (text: string) => void;
}

export function AffiliateSection({ user, summary, copyToClipboard }: AffiliateSectionProps) {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'FullT_GuardBot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${user?.referral_code}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
                <div className="premium-card p-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl">
                    <div className="bg-surface rounded-[22px] p-8 h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Zap className="w-40 h-40 text-amber-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="p-3 bg-white/10 w-fit rounded-xl backdrop-blur-sm text-white">
                                <Zap className="w-8 h-8" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Programa de Socios</h3>
                                <p className="text-white/80 font-medium text-sm mt-2">Gana comisiones vitalicias invitando a otros creadores a usar TeleGate.</p>
                            </div>

                            <div className="p-4 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Tu link de referido</p>
                                <div
                                    className="flex items-center gap-2 font-mono font-bold text-white cursor-pointer group"
                                    onClick={() => copyToClipboard(referralLink)}
                                >
                                    <span className="truncate">{referralLink}</span>
                                    <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {/* Stats Afiliados */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-6 bg-surface border border-surface-border rounded-2xl">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Ganado</p>
                        <h3 className="text-2xl font-black text-amber-500">${(summary?.affiliate_balance || 0).toFixed(2)}</h3>
                    </div>
                    <div className="p-6 bg-surface border border-surface-border rounded-2xl">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Referidos Activos</p>
                        <h3 className="text-2xl font-black text-foreground">0</h3> {/* TODO: Add real count if available */}
                    </div>
                    <div className="p-6 bg-surface border border-surface-border rounded-2xl">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Nivel Actual</p>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <h3 className="text-xl font-black text-foreground">Bronce</h3>
                        </div>
                    </div>
                </div>

                <div className="premium-card p-8 border-surface-border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Target className="w-5 h-5" /> Tu Progreso
                        </h3>
                        <span className="text-xs font-bold text-muted">Siguente Nivel: Plata (20% Comision)</span>
                    </div>

                    <div className="relative h-4 bg-surface-border rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 w-[15%]" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                        <span>0 Referidos</span>
                        <span>10 Referidos</span>
                    </div>

                    <div className="mt-8 p-6 bg-surface border border-surface-border rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Sube de Nivel</h4>
                            <p className="text-xs text-muted font-medium mt-1">
                                Invita a 10 creadores activos para desbloquear el nivel Plata y aumentar tus comisiones al 20% mensual recurrente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
