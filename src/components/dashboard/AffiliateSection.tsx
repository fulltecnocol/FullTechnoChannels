import { useEffect, useState } from 'react';
import { Zap, Copy, Loader2, Share2, Info, Edit3, Check, X, Search } from 'lucide-react';
import { ConfigItem, SummaryData, AffiliateNetworkResponse, AffiliateStats } from '@/lib/types';
import { apiRequest, affiliateApi } from '@/lib/api';
import { NetworkTree } from './affiliates/NetworkTree';
import { CommissionChart } from './affiliates/CommissionChart';
import { RevenueHistory } from './affiliates/RevenueHistory';
import { GamificationCard } from './affiliates/GamificationCard';
import { toast } from 'sonner';

interface AffiliateUser {
    referral_code?: string;
}

interface AffiliateSectionProps {
    user: AffiliateUser | null;
    summary: SummaryData | null;
    configs: ConfigItem[];
    copyToClipboard: (text: string) => void;
}

export function AffiliateSection({ user, summary, configs, copyToClipboard }: AffiliateSectionProps) {
    const [networkData, setNetworkData] = useState<AffiliateNetworkResponse | null>(null);
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [editingCode, setEditingCode] = useState(false);
    const [tempCode, setTempCode] = useState('');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [updatingCode, setUpdatingCode] = useState(false);

    const currentReferralCode = stats?.referral_code || user?.referral_code || '';
    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${currentReferralCode}` : '';

    const goldMin = configs.find(c => c.key === 'tier_gold_min')?.value || 6;
    const diamondMin = configs.find(c => c.key === 'tier_diamond_min')?.value || 21;

    // Determine Tier Logic (Frontend Fallback if not in summary)
    const activeRefs = stats?.direct_referrals || 0;
    const currentTier = activeRefs >= diamondMin ? "DIAMANTE" : (activeRefs >= goldMin ? "ORO" : "BRONCE");
    const nextMin = currentTier === "DIAMANTE" ? undefined : (currentTier === "ORO" ? diamondMin : goldMin);

    useEffect(() => {
        const fetchAffiliateData = async () => {
            try {
                if (!user) return;
                setLoading(true);
                const [net, st] = await Promise.all([
                    apiRequest<AffiliateNetworkResponse>('/affiliate/network'),
                    apiRequest<AffiliateStats>('/affiliate/stats')
                ]);
                setNetworkData(net);
                setStats(st);
            } catch (error) {
                console.error("Error fetching affiliate data:", error);
                toast.error("No se pudieron cargar los datos de afiliados");
            } finally {
                setLoading(false);
            }
        };

        fetchAffiliateData();
    }, [user]);

    const handleCheckCode = async (code: string) => {
        setTempCode(code);
        if (code.length < 3) {
            setIsAvailable(null);
            return;
        }
        try {
            const res = await affiliateApi.checkCode(code);
            setIsAvailable(res.available);
        } catch {
            setIsAvailable(null);
        }
    };

    const handleUpdateCode = async () => {
        if (!isAvailable && tempCode !== currentReferralCode) {
            toast.error("El código no está disponible o es inválido");
            return;
        }
        setUpdatingCode(true);
        try {
            await affiliateApi.updateCode(tempCode);
            setStats(prev => prev ? { ...prev, referral_code: tempCode } : null);
            setEditingCode(false);
            toast.success("Código de referido actualizado exitosamente");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error al actualizar el código";
            toast.error(message);
        } finally {
            setUpdatingCode(false);
        }
    };

    if (loading && !stats) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-amber-500 w-10 h-10" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Hero Section & Link Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Gamification Card */}
                <div className="lg:col-span-1">
                    <GamificationCard
                        currentTier={currentTier}
                        referralCount={activeRefs}
                        nextMin={nextMin}
                    />
                </div>

                {/* Right: Link & Quick Stats */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="premium-card p-6 border-amber-500/20 bg-gradient-to-r from-zinc-900 to-zinc-950 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20">
                                <Zap className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Tu Enlace Único</h3>
                                <p className="text-xs text-zinc-400">Comparte este link para empezar a ganar el 8% de comisión en 10 niveles.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {editingCode ? (
                                <div className="flex-1 flex flex-col gap-2 min-w-[280px]">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-xl border border-zinc-700">
                                        <span className="text-zinc-500 text-sm font-mono whitespace-nowrap">ref=</span>
                                        <input
                                            type="text"
                                            value={tempCode}
                                            onChange={(e) => handleCheckCode(e.target.value)}
                                            placeholder="mi-codigo-personalizado"
                                            className="bg-transparent border-none outline-none text-sm font-mono text-zinc-300 w-full"
                                            autoFocus
                                        />
                                        {tempCode.length >= 3 && (
                                            isAvailable ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdateCode}
                                            disabled={updatingCode || (isAvailable === false && tempCode !== currentReferralCode)}
                                            className="flex-1 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {updatingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditingCode(false)}
                                            className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold hover:bg-zinc-700"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        onClick={() => copyToClipboard(referralLink)}
                                        className="flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-black rounded-xl border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition-colors group"
                                    >
                                        <span className="text-sm font-mono text-zinc-300 truncate max-w-[200px]">{referralLink}</span>
                                        <Copy className="w-4 h-4 text-zinc-500 group-hover:text-amber-500" />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setTempCode(currentReferralCode);
                                            setEditingCode(true);
                                            setIsAvailable(true);
                                        }}
                                        className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                                        title="Editar Código"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-surface rounded-xl border border-surface-border">
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Ganancias Totales</p>
                            <h4 className="text-xl font-black text-emerald-400">${stats?.total_earnings.toFixed(2)}</h4>
                        </div>
                        <div className="p-4 bg-surface rounded-xl border border-surface-border">
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Referidos Directos</p>
                            <h4 className="text-xl font-black text-white">{activeRefs}</h4>
                        </div>
                        <div className="p-4 bg-surface rounded-xl border border-surface-border">
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Red Total (Est.)</p>
                            <h4 className="text-xl font-black text-zinc-300">
                                {networkData?.children?.length || 0} <span className="text-[10px] font-normal text-zinc-600">(Visible)</span>
                            </h4>
                        </div>
                        <div className="p-4 bg-surface rounded-xl border border-surface-border">
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Próximo Pago</p>
                            <h4 className="text-xl font-black text-zinc-300">Mensual</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Network Tree */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-amber-500" /> Tu Red de Negocios
                        </h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 font-bold text-zinc-400">10 Niveles</span>
                            <span className="text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 font-bold text-zinc-400">Actualizado Hoy</span>
                        </div>
                    </div>

                    <div className="min-h-[400px] bg-black/20 rounded-2xl border border-surface-border p-6 relative overflow-hidden">
                        {/* Tree Visualizer */}
                        <div className="absolute top-0 right-0 p-4">
                            <Info className="w-4 h-4 text-zinc-700 hover:text-zinc-500 cursor-help" />
                        </div>
                        <NetworkTree data={networkData?.children || []} loading={loading} />
                    </div>
                </div>

                {/* Right Column: Analytics & History */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-widest">Distribución de Ingresos</h3>
                        <div className="bg-surface rounded-2xl border border-surface-border p-4">
                            <CommissionChart data={stats?.earnings_by_level || []} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-widest">Actividad Reciente</h3>
                            <button className="text-[10px] text-amber-500 hover:underline">Ver Todo</button>
                        </div>
                        <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
                            <RevenueHistory history={stats?.recent_history || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


