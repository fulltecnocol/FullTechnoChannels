import { CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { Payment } from '@/lib/types';

interface AdminPaymentValidationProps {
    pendingPayments: Payment[];
    onValidatePayment: (paymentId: number, isValid: boolean) => Promise<void>;
}

export function AdminPaymentValidation({ pendingPayments, onValidatePayment }: AdminPaymentValidationProps) {
    return (
        <div className="space-y-6">
            <div className="premium-card p-8 border-amber-500/20 bg-amber-500/5">
                <h2 className="text-xl font-black uppercase tracking-tight text-amber-500 flex items-center gap-2">
                    <CreditCard className="w-6 h-6" /> Validación de Pagos Crypto
                </h2>
                <p className="text-muted font-bold mt-2">Revisa y aprueba manualmente los pagos reportados por hash.</p>
            </div>

            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-surface-border text-left">
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">ID</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Usuario</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Monto</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Hash / TXID</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Fecha</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {pendingPayments.length > 0 ? pendingPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-muted">#{payment.id.toString().slice(0, 6)}</td>
                                    <td className="p-4 font-bold">{payment.user_email}</td>
                                    <td className="p-4 font-black text-emerald-500">${payment.amount}</td>
                                    <td className="p-4 font-mono text-xs text-primary truncate max-w-[150px]" title={payment.transaction_hash}>
                                        {payment.transaction_hash}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-muted">{new Date(payment.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 flex items-center gap-2">
                                        <button
                                            onClick={() => onValidatePayment(payment.id, true)}
                                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                            title="Aprobar"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onValidatePayment(payment.id, false)}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                            title="Rechazar"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-muted font-bold opacity-50">
                                        No hay pagos pendientes de validación.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
