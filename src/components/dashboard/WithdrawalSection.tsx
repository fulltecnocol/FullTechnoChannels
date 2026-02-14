import { Wallet, History } from 'lucide-react';
import { useState } from 'react';
import { Withdrawal } from '@/lib/types';

interface SummaryData {
    available_balance?: number;
}

interface WithdrawalOption {
    id: string;
    name: string;
    description: string;
    active: boolean;
}

interface StatusConfig {
    [key: string]: string;
}

interface WithdrawalSectionProps {
    summary: SummaryData | null;
    withdrawals: Withdrawal[];
    withdrawalOptions: WithdrawalOption[];
    onRequestWithdrawal: (amount: number, method: string, details: string) => Promise<void>;
    statusLabels: StatusConfig;
    statusColors: StatusConfig;
}

export function WithdrawalSection({ summary, withdrawals, withdrawalOptions, onRequestWithdrawal, statusLabels, statusColors }: WithdrawalSectionProps) {
    const [selectedMethod, setSelectedMethod] = useState("stripe");
    const [amount, setAmount] = useState<string>("");
    const [details, setDetails] = useState<string>("");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Formulario de Retiro */}
            <div className="lg:col-span-1">
                <div className="p-6 bg-surface border border-surface-border rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Solicitar Retiro
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Monto a Retirar (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">$</span>
                                <input
                                    id="w_amount"
                                    type="number"
                                    placeholder="0.00"
                                    min="50"
                                    max={(summary?.available_balance || 0).toFixed(2)}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-4 pl-8 bg-background border border-surface-border rounded-xl font-bold text-lg outline-none focus:ring-1 ring-primary transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-muted font-bold text-right">Disponible: ${(summary?.available_balance || 0).toFixed(2)}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Método de Pago</label>
                            <div className="space-y-2">
                                {withdrawalOptions.map(option => (
                                    <label key={option.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedMethod === option.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-background border-surface-border hover:border-primary/50'} ${!option.active ? 'opacity-50 grayscale' : ''}`}>
                                        <input
                                            type="radio"
                                            name="w_method"
                                            value={option.id}
                                            checked={selectedMethod === option.id}
                                            disabled={!option.active}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                            className="mt-1 accent-primary"
                                        />
                                        <div>
                                            <p className="font-bold text-sm">{option.name}</p>
                                            <p className="text-[10px] text-muted font-medium">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase">Detalles de la Cuenta</label>
                            <textarea
                                id="w_details"
                                placeholder="Ej: Email de Stripe, Numero de cuenta, Dirección TRC20..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full p-4 bg-background border border-surface-border rounded-xl font-medium text-sm outline-none focus:ring-1 ring-primary transition-all min-h-[100px]"
                            />
                        </div>

                        <button
                            onClick={() => {
                                const amountVal = parseFloat(amount);
                                if (!amountVal || !details) return alert("Completa todos los campos");
                                onRequestWithdrawal(amountVal, selectedMethod, details);
                            }}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Confirmar Solicitud
                        </button>
                        <p className="text-[10px] text-center text-muted font-medium">
                            Mínimo de retiro $50.00 USD. Procesamiento en 24-48h hábiles.
                        </p>
                    </div>
                </div>
            </div>

            {/* Historial */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <History className="w-4 h-4" /> Historial de Transacciones
                </h3>

                <div className="premium-card overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface border-b border-surface-border text-left">
                                    <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider text-left">Fecha</th>
                                    <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider text-left">Método</th>
                                    <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider text-left">Monto</th>
                                    <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider text-left">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {withdrawals.length > 0 ? withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-background/50 transition-colors">
                                        <td className="p-4 font-bold text-muted">{w.request_date ? new Date(w.request_date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="p-4 font-bold text-foreground capitalize">{w.method}</td>
                                        <td className="p-4 font-bold text-foreground">${w.amount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[w.status] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                                {statusLabels[w.status] || w.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-muted font-bold">
                                            No hay retiros registrados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4 p-4">
                        {withdrawals.length > 0 ? withdrawals.map((w) => (
                            <div key={w.id} className="p-4 bg-background border border-surface-border rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[w.status] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                            {statusLabels[w.status] || w.status}
                                        </span>
                                        <span className="text-[10px] text-muted font-bold">{w.request_date ? new Date(w.request_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <p className="font-bold text-foreground capitalize text-sm">{w.method}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-foreground">${w.amount.toFixed(2)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-muted font-bold text-sm">
                                No hay retiros registrados aún.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
