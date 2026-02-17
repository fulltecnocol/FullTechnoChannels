
import { Ticket, Copy, Trash2 } from 'lucide-react';
import { Promotion } from '@/lib/types';

interface PromotionsManagerProps {
    managingPromos: any; // Channel object
    setManagingPromos: (value: any) => void;
    promotions: Promotion[];
    handleCreatePromo: (channelId: number, data: any) => void;
    handleDeletePromo: (id: number) => void;
    copyToClipboard: (text: string) => void;
}

export function PromotionsManager({
    managingPromos, setManagingPromos, promotions,
    handleCreatePromo, handleDeletePromo, copyToClipboard
}: PromotionsManagerProps) {
    if (!managingPromos) return null;

    return (
        <div className="space-y-10 animate-fade-in premium-card p-10 bg-surface/50 border-amber-500/20">
            <header className="flex items-center justify-between border-b border-surface-border pb-6">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 text-amber-500">
                        <Ticket className="w-8 h-8" /> Promociones: {managingPromos.title}
                    </h2>
                    <p className="text-muted font-medium">Crea links de oferta y pases de cortesía para atraer nuevos miembros.</p>
                </div>
                <button
                    onClick={() => setManagingPromos(null)}
                    className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors"
                >
                    Cerrar
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Formulario Nueva Promo */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-background rounded-2xl border border-surface-border space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Nueva Oferta</h3>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Código del Link</label>
                            <input id="p_code" type="text" placeholder="EJ: VERANO50" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold uppercase transition-all focus:ring-1 ring-amber-500 outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Tipo de Oferta</label>
                            <select id="p_type" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500">
                                <option value="discount">Descuento (Primer Pago %)</option>
                                <option value="trial">Días Gratis (Prueba sin Tarjeta)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Valor (Días o % decimal)</label>
                            <input id="p_value" type="number" step="0.01" placeholder="Ej: 7 o 0.50 para 50%" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Límite de Usos (Opcional)</label>
                            <input id="p_max" type="number" placeholder="Ej: 20" className="w-full p-3 bg-surface border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-amber-500" />
                        </div>

                        <button
                            onClick={() => {
                                const code = (document.getElementById('p_code') as HTMLInputElement).value;
                                const type = (document.getElementById('p_type') as HTMLSelectElement).value;
                                const value = parseFloat((document.getElementById('p_value') as HTMLInputElement).value);
                                const max = (document.getElementById('p_max') as HTMLInputElement).value;
                                if (!code || !value) return alert("Completa los campos obligatorios");
                                handleCreatePromo(managingPromos.id, { code, promo_type: type, value, max_uses: max ? parseInt(max) : null });
                            }}
                            className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                        >
                            Generar Link de Oferta
                        </button>
                    </div>
                </div>

                {/* Lista de Promos Activas */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Links de Oferta Activos</h3>
                    <div className="premium-card overflow-hidden divide-y divide-surface-border">
                        {promotions.length > 0 ? promotions.map(p => (
                            <div key={p.id} className="p-6 flex items-center justify-between hover:bg-background/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-amber-500 tracking-tight">{p.code}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${p.promo_type === 'trial' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                            {p.promo_type === 'trial' ? 'PRUEBA GRATIS' : 'DESCUENTO'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            copyToClipboard(`https://t.me/FTGateBot?start=${p.code}`);
                                        }}
                                        className="text-[10px] text-muted flex items-center gap-1.5 hover:text-primary transition-colors font-mono"
                                    >
                                        t.me/FTGateBot?start={p.code} <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Usos</p>
                                        <p className="text-sm font-black text-primary">{p.current_uses} / {p.max_uses || '∞'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Valor</p>
                                        <p className="text-sm font-black text-primary">
                                            {p.promo_type === 'discount' ? `-${(p.value * 100).toFixed(0)}%` : `${p.value} días`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePromo(p.id)}
                                        className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-all hover:scale-110"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center space-y-3">
                                <Ticket className="w-12 h-12 text-muted mx-auto opacity-20" />
                                <p className="text-muted font-bold">No has creado ninguna oferta para este canal todavía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
