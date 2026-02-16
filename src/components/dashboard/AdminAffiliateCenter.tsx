import { useState, useEffect } from 'react';
import {
    Zap, BarChart, List, Search, Users, TrendingUp, DollarSign,
    Globe, ShieldCheck, Loader2, User
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminAffiliateStats, AffiliateLedgerEntry, AffiliateNetworkResponse } from '@/lib/types';
import { NetworkTree } from './affiliates/NetworkTree';
import { toast } from 'sonner';

export function AdminAffiliateCenter() {
    const [stats, setStats] = useState<AdminAffiliateStats | null>(null);
    const [ledger, setLedger] = useState<AffiliateLedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'stats' | 'ledger' | 'audit'>('stats');

    // Audit view states
    const [searchUserId, setSearchUserId] = useState('');
    const [auditedTree, setAuditedTree] = useState<AffiliateNetworkResponse | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [s, l] = await Promise.all([
                adminApi.getAffiliateStats(),
                adminApi.getAffiliateLedger(50, 0)
            ]);
            setStats(s);
            setLedger(l);
        } catch (error) {
            toast.error("Error al cargar datos de afiliados");
        } finally {
            setLoading(false);
        }
    };

    const handleAuditUser = async () => {
        if (!searchUserId) return;
        setIsAuditing(true);
        try {
            const tree = await adminApi.getAffiliateTree(Number(searchUserId));
            setAuditedTree(tree);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Usuario no encontrado";
            toast.error(message);
            setAuditedTree(null);
        } finally {
            setIsAuditing(false);
        }
    };

    if (loading && !stats) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                        <Zap className="w-8 h-8" /> Central de Afiliados Multinivel
                    </h2>
                    <p className="text-muted font-medium">Panel Maestro de Monitoreo, Auditoría y Ganancias Globales.</p>
                </div>

                <div className="flex bg-surface border border-surface-border rounded-xl p-1">
                    <button
                        onClick={() => setActiveView('stats')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'stats' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-white'}`}
                    >
                        <BarChart className="w-3.5 h-3.5" /> Métricas
                    </button>
                    <button
                        onClick={() => setActiveView('ledger')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'ledger' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-white'}`}
                    >
                        <List className="w-3.5 h-3.5" /> Libro Mayor
                    </button>
                    <button
                        onClick={() => setActiveView('audit')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'audit' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-white'}`}
                    >
                        <Search className="w-3.5 h-3.5" /> Auditoría
                    </button>
                </div>
            </header>

            {/* --- VIEW: STATS --- */}
            {activeView === 'stats' && stats && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="premium-card p-6 border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-center gap-3 text-amber-500 mb-2">
                                <DollarSign className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Comisiones Pagadas</span>
                            </div>
                            <p className="text-3xl font-black">${stats.total_commissions_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-muted-foreground mt-1">Acumulado histórico en toda la plataforma</p>
                        </div>

                        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
                            <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                <Users className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Reclutadores Activos</span>
                            </div>
                            <p className="text-3xl font-black">{stats.active_recruiters}</p>
                            <p className="text-xs text-muted-foreground mt-1">Usuarios con al menos 1 referido directo</p>
                        </div>

                        <div className="premium-card p-6 border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Globe className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Alcance de Red</span>
                            </div>
                            <p className="text-3xl font-black">10 Niveles</p>
                            <p className="text-xs text-muted-foreground mt-1">Profundidad actual del sistema MLM</p>
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Distribución de Ganancias por Nivel
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {stats.earnings_by_level.map((level) => (
                                <div key={level.level} className="p-4 bg-background border border-surface-border rounded-2xl group hover:border-primary/50 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Nivel {level.level}</p>
                                    <p className="text-xl font-bold">${level.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    <div className="mt-2 h-1 w-full bg-surface-border rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(level.amount / stats.total_commissions_paid) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: LEDGER --- */}
            {activeView === 'ledger' && (
                <div className="premium-card overflow-hidden">
                    <div className="p-6 border-b border-surface-border">
                        <h3 className="font-bold flex items-center gap-2">
                            <List className="w-5 h-5 text-primary" /> Historial Maestro de Comisiones
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-background/50 text-[10px] font-black uppercase tracking-widest text-muted border-b border-surface-border">
                                    <th className="p-5">Fecha / ID</th>
                                    <th className="p-5">Afiliado Receptor</th>
                                    <th className="p-5">Origen (User)</th>
                                    <th className="p-5">Nivel</th>
                                    <th className="p-5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {ledger.map(entry => (
                                    <tr key={entry.id} className="hover:bg-background/30 transition-colors">
                                        <td className="p-5">
                                            <p className="text-xs font-bold text-white">{new Date(entry.created_at).toLocaleString()}</p>
                                            <p className="text-[10px] text-muted">ID: {entry.id}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{entry.affiliate_name}</p>
                                                    <p className="text-[10px] text-muted">UID: {entry.affiliate_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-medium">@{entry.source_user}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-0.5 bg-zinc-800 text-amber-500 text-[10px] font-black rounded border border-amber-500/20">
                                                Nivel {entry.level}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-black text-emerald-500">
                                            +${entry.amount.toFixed(4)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VIEW: AUDIT --- */}
            {activeView === 'audit' && (
                <div className="space-y-6">
                    <div className="premium-card p-8 bg-surface-border/20 border-dashed">
                        <div className="max-w-xl mx-auto space-y-4 text-center">
                            <h3 className="text-xl font-bold">Auditoría de Red por Usuario</h3>
                            <p className="text-sm text-muted mb-6">Ingresa el ID de cualquier usuario para visualizar su árbol de referidos de 10 niveles completo.</p>

                            <div className="flex gap-2 p-2 bg-background border border-surface-border rounded-2xl shadow-inner group-focus-within:border-primary transition-all">
                                <input
                                    type="number"
                                    placeholder="ID del Usuario (Ej: 42)"
                                    value={searchUserId}
                                    onChange={(e) => setSearchUserId(e.target.value)}
                                    className="flex-1 bg-transparent px-4 py-2 outline-none font-bold"
                                />
                                <button
                                    onClick={handleAuditUser}
                                    disabled={isAuditing || !searchUserId}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Auditar
                                </button>
                            </div>
                        </div>
                    </div>

                    {auditedTree && (
                        <div className="animate-in slide-in-from-bottom duration-500">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted">Resultados de Auditoría</p>
                                        <h4 className="text-lg font-bold">Red de: {auditedTree.root_name}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        Estatus Verificado
                                    </p>
                                </div>
                            </div>

                            <div className="premium-card p-8">
                                <NetworkTree data={auditedTree.children} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
