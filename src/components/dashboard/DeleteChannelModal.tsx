import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { ownerApi } from '@/lib/api';

interface DeleteChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelId: number;
    channelTitle: string;
    onSuccess: () => void;
}

export function DeleteChannelModal({ isOpen, onClose, channelId, channelTitle, onSuccess }: DeleteChannelModalProps) {
    const [step, setStep] = useState(1); // 1: Initial Warning, 2: Loading Cost, 3: Cost Confirmation
    const [loading, setLoading] = useState(false);
    const [costData, setCostData] = useState<any>(null);

    if (!isOpen) return null;

    const handleInitialConfirm = async () => {
        setLoading(true);
        try {
            // First try simple delete
            await ownerApi.deleteChannel(channelId);
            onSuccess();
            onClose();
        } catch (error: any) {
            // Check if error is HAS_ACTIVE_SUBS
            // Unfortunately apiRequest throws generic Error with message.
            // Backend sends detail="HAS_ACTIVE_SUBS"
            if (error.message.includes("HAS_ACTIVE_SUBS")) {
                // Fetch cost
                try {
                    const data = await ownerApi.getDeleteChannelCost(channelId);
                    setCostData(data);
                    setStep(3);
                } catch (e) {
                    alert("Error al calcular costos de cancelación.");
                    onClose();
                }
            } else {
                alert(error.message);
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFinalDelete = async () => {
        setLoading(true);
        try {
            await ownerApi.deleteChannel(channelId, true);
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md premium-card p-8 space-y-6 animate-in zoom-in-95 shadow-2xl relative border-red-500/20">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted hover:text-foreground rounded-full hover:bg-surface-border transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-red-500">Eliminar Canal</h2>
                    <p className="text-muted font-medium">Estás a punto de eliminar <b>{channelTitle}</b></p>
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2 text-center">
                            <p className="text-sm text-red-500/80 font-bold leading-relaxed">
                                Esta acción es irreversible. Se perderán todos los datos, configuraciones y enlaces de afiliados.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 text-muted font-bold hover:bg-surface rounded-xl transition-colors">Cancelar</button>
                            <button
                                onClick={handleInitialConfirm}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && costData && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-amber-500">Suscriptores Activos Detectados</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Para eliminar este canal, debes cancelar las suscripciones activas. Esto conlleva una penalización por incumplimiento de contrato.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 py-2 border-t border-amber-500/10 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Suscriptores afectados:</span>
                                    <span className="font-bold">{costData.active_subscribers}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Reembolso a usuarios:</span>
                                    <span className="font-bold">${costData.refund_amount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Penalización (20%):</span>
                                    <span className="font-bold">+${costData.penalty_amount}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black border-t border-dashed border-amber-500/20 pt-2 mt-2">
                                    <span>Total a Pagar:</span>
                                    <span>${costData.total_cost}</span>
                                </div>
                            </div>

                            {!costData.can_afford && (
                                <div className="p-3 bg-red-500/10 rounded-lg text-xs font-bold text-red-500 text-center">
                                    Saldo insuficiente. Recarga tu cuenta o espera a que finalicen las suscripciones.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 text-muted font-bold hover:bg-surface rounded-xl transition-colors">Cancelar</button>
                            <button
                                onClick={handleFinalDelete}
                                disabled={loading || !costData.can_afford}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pagar y Eliminar"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
