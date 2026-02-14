
import { CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Payment } from '@/lib/types';

interface AdminPaymentsProps {
    adminPayments: Payment[];
    handleVerifyCrypto: (id: number) => void;
    mounted: boolean;
}

export function AdminPayments({ adminPayments, handleVerifyCrypto, mounted }: AdminPaymentsProps) {
    return (
        <div className="space-y-10 animate-fade-in">
            <header>
                <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <CreditCard className="w-8 h-8" /> Validación de Pagos Manuales (Crypto)
                </h2>
                <p className="text-muted font-medium">Revisa y aprueba transacciones de criptomonedas recibidas.</p>
            </header>

            <div className="space-y-6">
                <h3 className="text-xl font-bold">Pagos Pendientes de Verificación</h3>
                {adminPayments.filter(p => p.status === 'pending').length > 0 ? (
                    <div className="premium-card overflow-hidden text-left">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-background/50 text-[10px] font-black uppercase tracking-widest text-muted border-b border-surface-border">
                                    <th className="p-5">ID / Fecha</th>
                                    <th className="p-5">Usuario ID</th>
                                    <th className="p-5">Monto</th>
                                    <th className="p-5">Referencia</th>
                                    <th className="p-5">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {adminPayments.filter(p => p.status === 'pending').map(p => (
                                    <tr key={p.id} className="hover:bg-background/30 transition-colors">
                                        <td className="p-5">
                                            <p className="font-bold text-sm">#{p.id}</p>
                                            <p className="text-[10px] text-muted">{mounted ? new Date(p.created_at).toLocaleString() : '...'}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">U-{p.user_id}</span>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-black text-emerald-500">${p.amount.toFixed(2)} USDT</p>
                                        </td>
                                        <td className="p-5">
                                            <code className="text-[10px] font-mono bg-background p-1 rounded border border-surface-border">{p.provider_tx_id}</code>
                                        </td>
                                        <td className="p-5">
                                            <button
                                                onClick={() => handleVerifyCrypto(p.id)}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:scale-105 transition-all shadow-md shadow-primary/10"
                                            >
                                                Verificar & Activar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center premium-card border-emerald-500/20 bg-emerald-500/5">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                        <p className="text-sm font-bold text-emerald-500">No hay pagos de criptomonedas pendientes. ✨</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl text-left">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Flujo de Control
                </h4>
                <p className="text-xs text-muted font-medium leading-relaxed">
                    1. El usuario envía el pago y abre un ticket con su Hash de transacción.<br />
                    2. Verifica el hash en el explorador de bloques de la red correspondiente (ej: TRONSCAN para TRC20).<br />
                    3. Busca el ID de pago o monto en esta tabla.<br />
                    4. Haz clic en "Verificar" para activar la membresía, distribuir los fondos MLM y notificar al usuario.
                </p>
            </div>
        </div>
    );
}
