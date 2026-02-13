import { useState } from 'react';
import { LayoutGrid, AlertCircle, ArrowRight, CheckCircle2, Copy, Send, ShieldAlert, X } from 'lucide-react';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    step: number;
    createdChannel: any;
    copyToClipboard: (text: string) => void;
}

export function CreateChannelModal({ isOpen, onClose, onSubmit, step, createdChannel, copyToClipboard }: CreateChannelModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-xl premium-card p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <LayoutGrid className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Vincular Nuevo Canal</h2>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Paso {step} de 2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-border rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted hover:text-foreground" />
                    </button>
                </header>

                {step === 1 ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                Apertura de Registro
                            </label>
                            <input
                                id="new_channel_title"
                                type="text"
                                placeholder="Ej: Canal de Señales VIP"
                                autoFocus
                                className="w-full p-4 bg-background border border-surface-border rounded-xl focus:ring-1 ring-primary outline-none font-bold text-lg placeholder:font-medium placeholder:text-muted/40 transition-all"
                            />
                            <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl">
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                    Este título es descriptivo. Podrás cambiar el branding y el nombre del canal en los siguientes pasos.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const title = (document.getElementById('new_channel_title') as HTMLInputElement).value;
                                if (!title) return alert("Por favor introduce un nombre para el canal.");
                                onSubmit(title);
                            }}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            Generar Código de Vinculación <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm mb-1">
                                <CheckCircle2 className="w-5 h-5" /> Registro Iniciado
                            </div>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[85%]">
                                Se ha generado el código único para <b>{createdChannel?.title}</b>. Sigue los pasos para completar la integración.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-primary text-[8px] flex items-center justify-center text-white">1</span>
                                    Copia tu Código de Vinculación
                                </p>
                                <div className="flex items-center gap-2 p-5 bg-background border border-surface-border rounded-2xl font-mono text-xl font-bold group hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => copyToClipboard(createdChannel?.validation_code)}>
                                    <span className="flex-1 tracking-wider text-primary">{createdChannel?.validation_code}</span>
                                    <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <Copy className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-primary text-[8px] flex items-center justify-center text-white">2</span>
                                    Vincular en Telegram
                                </p>
                                <div className="space-y-3">
                                    <a
                                        href={`https://t.me/FullT_GuardBot?start=${createdChannel?.validation_code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-5 bg-[#0088cc] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Abrir Bot de Vinculación
                                    </a>

                                    <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0">
                                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <p className="text-[10px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-wide">
                                            Asegúrate de que el bot sea <b>Administrador</b> en tu canal privado antes de enviarle el código.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 text-muted font-black text-xs hover:text-primary transition-all uppercase tracking-widest border border-transparent hover:border-surface-border rounded-xl"
                        >
                            Entendido, volver al dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
