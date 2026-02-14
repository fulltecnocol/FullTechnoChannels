import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, DollarSign, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { ownerApi } from '@/lib/api';
import { Plan, Channel } from '@/lib/types';

interface PlanManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel | null;
}

export function PlanManagementModal({ isOpen, onClose, channel }: PlanManagementModalProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState<number | 'new' | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state for new plan
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '',
        description: '',
        price: 0,
        duration_days: 30
    });

    useEffect(() => {
        if (isOpen && channel) {
            loadPlans();
        }
    }, [isOpen, channel]);

    const loadPlans = async () => {
        if (!channel) return;
        setIsLoading(true);
        try {
            const data = await ownerApi.getPlans(channel.id);
            setPlans(data);
        } catch (err) {
            setError("Error al cargar los planes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!channel) return;
        if (!newPlan.name || newPlan.price <= 0 || newPlan.duration_days <= 0) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        setIsSaving('new');
        try {
            await ownerApi.createPlan(channel.id, newPlan);
            setShowNewForm(false);
            setNewPlan({ name: '', description: '', price: 0, duration_days: 30 });
            await loadPlans();
        } catch (err) {
            alert("Error al crear el plan");
        } finally {
            setIsSaving(null);
        }
    };

    const handleUpdatePlan = async (planId: number, data: Partial<Plan>) => {
        setIsSaving(planId);
        try {
            await ownerApi.updatePlan(planId, data);
            await loadPlans();
        } catch (err) {
            alert("Error al actualizar el plan");
        } finally {
            setIsSaving(null);
        }
    };

    const handleDeletePlan = async (planId: number) => {
        if (!confirm("¿Estás seguro de eliminar este plan?")) return;

        try {
            const res = await ownerApi.deletePlan(planId) as { status?: string };
            if (res?.status === 'deactivated') {
                alert("El plan tiene suscripciones activas, por lo que ha sido desactivado en lugar de eliminado.");
            }
            await loadPlans();
        } catch (err) {
            alert("Error al eliminar el plan");
        }
    };

    if (!isOpen || !channel) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-4xl premium-card p-8 space-y-8 animate-in zoom-in-95 duration-300 border-primary/20 shadow-2xl overflow-y-auto max-h-[90vh]">
                <header className="flex items-center justify-between border-b border-surface-border pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Gestionar Precios</h2>
                            <p className="text-xs text-muted font-bold uppercase tracking-widest">{channel.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-border rounded-xl transition-colors">
                        <X className="w-6 h-6 text-muted" />
                    </button>
                </header>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Planes Configurados
                        </h3>
                        <button
                            onClick={() => setShowNewForm(!showNewForm)}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-primary/20 transition-all flex items-center gap-2"
                        >
                            {showNewForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showNewForm ? "Cancelar" : "Nuevo Plan"}
                        </button>
                    </div>

                    {showNewForm && (
                        <div className="p-6 bg-surface border border-primary/30 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nombre del Plan</label>
                                    <input
                                        type="text"
                                        placeholder="Mensual, VIP, etc."
                                        value={newPlan.name}
                                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                        className="w-full p-3 bg-background border border-surface-border rounded-xl text-sm font-bold focus:ring-1 ring-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Precio (USD)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            type="number"
                                            value={newPlan.price}
                                            onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                                            className="w-full p-3 pl-9 bg-background border border-surface-border rounded-xl text-sm font-bold focus:ring-1 ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Duración (Días)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            type="number"
                                            value={newPlan.duration_days}
                                            onChange={(e) => setNewPlan({ ...newPlan, duration_days: parseInt(e.target.value) })}
                                            className="w-full p-3 pl-9 bg-background border border-surface-border rounded-xl text-sm font-bold focus:ring-1 ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleCreatePlan}
                                        disabled={isSaving === 'new'}
                                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSaving === 'new' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Crear Plan</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-20 text-center animate-pulse">Cargando planes...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {plans.length === 0 ? (
                                <div className="py-12 border-2 border-dashed border-surface-border rounded-3xl flex flex-col items-center justify-center text-muted gap-3">
                                    <Info className="w-10 h-10 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No hay planes activos. Crea uno para empezar a vender.</p>
                                </div>
                            ) : (
                                plans.map(plan => (
                                    <div key={plan.id} className={`premium-card p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${!plan.is_active ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex items-center gap-6 flex-1 w-full">
                                            <div className="w-12 h-12 rounded-xl bg-surface-border/50 flex items-center justify-center font-black text-primary text-lg border border-surface-border">
                                                {plan.duration_days >= 365 ? '1Y' : plan.duration_days >= 30 ? `${Math.round(plan.duration_days / 30)}M` : `${plan.duration_days}D`}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-lg uppercase tracking-tight">{plan.name}</h4>
                                                    {!plan.is_active && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded uppercase tracking-widest">Inactivo</span>}
                                                </div>
                                                <p className="text-xs text-muted font-bold">${plan.price} USD / {plan.duration_days} días</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                onClick={() => handleUpdatePlan(plan.id, { is_active: !plan.is_active })}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${plan.is_active
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    }`}
                                            >
                                                {plan.is_active ? 'Pausar' : 'Activar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-primary/80 font-bold leading-relaxed uppercase tracking-wide">
                        <b>Nota de precios</b>: Puedes crear múltiples planes (Ej: Mensual, Trimestral, Anual). El bot mostrará automáticamente todas las opciones activas a tus clientes cuando intenten unirse al canal.
                    </p>
                </div>
            </div>
        </div>
    );
}
