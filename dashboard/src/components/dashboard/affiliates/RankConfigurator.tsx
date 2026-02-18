import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { AffiliateRank, RankCreate } from '@/lib/types';
import { toast } from 'sonner';
import { Trash2, Plus, Star, Trophy, Loader2 } from 'lucide-react';

export function RankConfigurator() {
    const [ranks, setRanks] = useState<AffiliateRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newMin, setNewMin] = useState(0);
    const [newBonus, setNewBonus] = useState(0);
    const [newIcon, setNewIcon] = useState('🎖️');

    useEffect(() => {
        fetchRanks();
    }, []);

    const fetchRanks = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAffiliateRanks();
            setRanks(data);
        } catch (error) {
            toast.error("Error al cargar rangos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const payload: RankCreate = {
                name: newName,
                min_referrals: newMin,
                bonus_percentage: newBonus,
                icon: newIcon
            };
            const created = await adminApi.createAffiliateRank(payload);
            setRanks(prev => [...prev, created].sort((a, b) => a.min_referrals - b.min_referrals));
            toast.success("Rango creado exitosamente");

            // Reset form
            setNewName('');
            setNewMin(0);
            setNewBonus(0);
        } catch (error) {
            toast.error("Error al crear rango");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro? Esto podría afectar a los cálculos de afiliados.")) return;
        try {
            await adminApi.deleteAffiliateRank(id);
            setRanks(prev => prev.filter(r => r.id !== id));
            toast.success("Rango eliminado");
        } catch (error) {
            toast.error("Error al eliminar rango");
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                        <Trophy className="w-6 h-6" /> Configuración de Rangos Dinámicos
                    </h3>
                    <p className="text-sm text-muted">Define los niveles que los usuarios pueden alcanzar basándose en sus referidos directos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List of Ranks */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ranks.map((rank) => (
                            <div key={rank.id} className="premium-card p-5 border-surface-border hover:border-primary/50 transition-colors relative group">
                                <button
                                    onClick={() => handleDelete(rank.id)}
                                    className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-surface text-2xl flex items-center justify-center rounded-xl border border-surface-border">
                                        {rank.icon || '🎖️'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-tight">{rank.name}</h4>
                                        <p className="text-xs text-muted font-bold">Mínimo: {rank.min_referrals} Referidos</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-background rounded-xl border border-surface-border flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted uppercase">Bono Extra</span>
                                    <span className="text-sm font-black text-emerald-500">+{rank.bonus_percentage}%</span>
                                </div>
                            </div>
                        ))}

                        {ranks.length === 0 && (
                            <div className="col-span-full p-10 text-center border border-dashed border-surface-border rounded-xl">
                                <p className="text-muted font-bold">No hay rangos definidos.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Form */}
                <div className="premium-card p-6 h-fit sticky top-4">
                    <h4 className="font-bold border-b border-surface-border pb-3 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" /> Nuevo Rango
                    </h4>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-muted">Nombre del Rango</label>
                            <input
                                type="text"
                                required
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ej: Diamante Negro"
                                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-muted">Min. Referidos</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={newMin}
                                    onChange={e => setNewMin(Number(e.target.value))}
                                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-muted">Bono %</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.1"
                                    value={newBonus}
                                    onChange={e => setNewBonus(Number(e.target.value))}
                                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-muted">Icono (Emoji)</label>
                            <input
                                type="text"
                                value={newIcon}
                                onChange={e => setNewIcon(e.target.value)}
                                placeholder="Ej: 💎"
                                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-lg text-center"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                            Crear Rango
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
