
import { Palette, PenTool, History, ShieldCheck } from 'lucide-react';

interface BrandingEditorProps {
    editingBranding: any; // Channel object
    setEditingBranding: (value: any) => void;
    handleUpdateBranding: (id: number, welcome: string, expiration: string) => void;
}

export function BrandingEditor({ editingBranding, setEditingBranding, handleUpdateBranding }: BrandingEditorProps) {
    if (!editingBranding) return null;

    return (
        <div className="space-y-10 animate-fade-in premium-card p-10 bg-surface/50 border-primary/20">
            <header className="flex items-center justify-between border-b border-surface-border pb-6">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                        <Palette className="w-8 h-8" /> Branding: {editingBranding.title}
                    </h2>
                    <p className="text-muted font-medium">Personaliza el lenguaje de tu marca en Telegram.</p>
                </div>
                <button
                    onClick={() => setEditingBranding(null)}
                    className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors"
                >
                    Cancelar
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <PenTool className="w-4 h-4" /> Mensaje de Bienvenida
                        </label>
                        <p className="text-xs text-muted">Se envía cuando alguien completa su pago exitosamente.</p>
                        <textarea
                            id="welcome_msg"
                            defaultValue={editingBranding.welcome_message || "¡Hola! Bienvenido a mi comunidad premium."}
                            rows={4}
                            className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <History className="w-4 h-4" /> Mensaje de Expiración
                        </label>
                        <p className="text-xs text-muted">Se envía 24h antes de que termine su suscripción.</p>
                        <textarea
                            id="expiration_msg"
                            defaultValue={editingBranding.expiration_message || "Tu suscripción está por vencer. ¡Renuévala para no perder el acceso!"}
                            rows={4}
                            className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none text-sm font-medium"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const welcome = (document.getElementById('welcome_msg') as HTMLTextAreaElement).value;
                            const expiration = (document.getElementById('expiration_msg') as HTMLTextAreaElement).value;
                            handleUpdateBranding(editingBranding.id, welcome, expiration);
                        }}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        Guardar Cambios de Marca
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                        <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Consejos de Branding
                        </h4>
                        <ul className="text-xs text-muted space-y-2 list-disc pl-4 font-medium">
                            <li>Usa un tono que conecte con tu audiencia (ej: VIP, Master, Amigo).</li>
                            <li>Menciona los beneficios clave del acceso premium.</li>
                            <li>Incluye instrucciones claras de qué hacer después de unirse.</li>
                        </ul>
                    </div>
                    <div className="p-8 bg-background border border-surface-border rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter rounded-bl-2xl">Vista Previa Bot</div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black text-xs">BT</div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">Membership Bot</p>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">bot oficial</p>
                            </div>
                        </div>
                        <div className="p-4 bg-surface-border/20 rounded-2xl text-xs leading-relaxed font-medium italic">
                            "El mensaje personalizado aparecerá aquí siguiendo el estilo de Telegram..."
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
