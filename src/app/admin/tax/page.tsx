"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Calculator, Receipt, Calendar, ShieldCheck,
    Plus, Trash2, ArrowLeft, Loader2, DollarSign,
    TrendingDown, TrendingUp, AlertTriangle, CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { TaxSummary, Expense } from "@/lib/types";

export default function AdminTaxPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<TaxSummary | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({ description: "", amount: "", category: "Software", date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchData();
    }, [year]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryData, expensesData] = await Promise.all([
                adminApi.getTaxSummary(year),
                adminApi.getExpenses(year)
            ]);
            setSummary(summaryData);
            setExpenses(expensesData);
        } catch (err: unknown) {
            console.error("Error fetching tax data:", err);
            if (err instanceof Error && err.message.includes("403")) router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createExpense({
                ...form,
                amount: parseFloat(form.amount),
            });
            setIsAddOpen(false);
            setForm({ description: "", amount: "", category: "Software", date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (err) {
            alert("Error al guardar gasto");
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        try {
            await adminApi.deleteExpense(id);
            fetchData();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    if (loading && !summary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                        </button>
                        <h1 className="text-4xl font-black tracking-tight">
                            Admin <span className="gradient-text">Tax Hub</span>
                        </h1>
                        <p className="text-muted font-medium">Gestión fiscal personal para el dueño de FGate</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-surface border border-primary/20 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 ring-primary/50"
                        >
                            <option value={2024}>Año Fiscal 2024</option>
                            <option value={2025}>Año Fiscal 2025</option>
                            <option value={2026}>Año Fiscal 2026</option>
                        </select>
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="premium-button py-2 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Nuevo Gasto
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold text-emerald-500/60 uppercase tracking-widest">Gross Revenue</span>
                        </div>
                        <h3 className="text-3xl font-black">${summary?.gross_revenue?.toLocaleString() || "0.00"}</h3>
                        <p className="text-sm text-muted mt-1 font-medium">Ingresos de plataforma</p>
                    </div>

                    <div className="premium-card p-6 border-red-500/20 bg-red-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <TrendingDown className="w-6 h-6 text-red-500" />
                            </div>
                            <span className="text-xs font-bold text-red-500/60 uppercase tracking-widest">Business Expenses</span>
                        </div>
                        <h3 className="text-3xl font-black">-${summary?.total_expenses?.toLocaleString() || "0.00"}</h3>
                        <p className="text-sm text-muted mt-1 font-medium">Deducibles registrados</p>
                    </div>

                    <div className="premium-card p-6 border-primary/20 bg-primary/5 ring-2 ring-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck className="w-24 h-24 text-primary" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Calculator className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">Estimated Net Income</span>
                        </div>
                        <h3 className="text-3xl font-black">${summary?.net_income?.toLocaleString() || "0.00"}</h3>
                        <p className="text-sm text-muted mt-1 font-medium">Ganancia real antes de impuestos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Expenses Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Receipt className="w-6 h-6 text-primary" /> Historial de Gastos
                            </h2>
                        </div>
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface/50 border-b border-primary/10">
                                        <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Descripción</th>
                                            <th className="px-6 py-4">Categoría</th>
                                            <th className="px-6 py-4 text-right">Monto</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {expenses.length > 0 ? expenses.map((e) => (
                                            <tr key={e.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-bold opacity-60">
                                                    {new Date(e.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-bold">{e.description}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-surface border border-primary/10 rounded-full text-xs font-bold">
                                                        {e.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-red-400">
                                                    -${e.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteExpense(e.id)}
                                                        className="p-2 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted font-medium italic">
                                                    No hay gastos registrados en este año.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Proactive Checklist */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" /> US Compliance Checklist
                        </h2>
                        <div className="space-y-4">
                            <ComplianceTask
                                title="Form 5472 & 1120"
                                date="Abril 15, 2026"
                                desc="Reporte informativo anual para dueños extranjeros."
                                status="pending"
                            />
                            <ComplianceTask
                                title="Annual Report (Wyoming/Delaware)"
                                date="Mayo 01, 2026"
                                desc="Renovación de la entidad con el estado."
                                status="pending"
                            />
                            <ComplianceTask
                                title="Registered Agent Renewal"
                                date="Variable"
                                desc="Pago anual al agente registrado en USA."
                                status="completed"
                            />
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-3 text-yellow-500 text-sm italic font-medium">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <span>No brindamos asesoría legal ni contable. Consulta con tu contador para los formularios finales.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="premium-card w-full max-w-md p-8 shadow-2xl animate-scale-up">
                        <h2 className="text-2xl font-black mb-6">Registrar Nuevo Gasto</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted">Descripción</label>
                                <input
                                    type="text" required value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-surface border border-primary/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/50"
                                    placeholder="Ej: Hosting Vercel"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted">Monto (USD)</label>
                                    <input
                                        type="number" step="0.01" required value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-surface border border-primary/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted">Fecha</label>
                                    <input
                                        type="date" required value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-surface border border-primary/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/50 text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted">Categoría</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-surface border border-primary/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/50"
                                >
                                    <option>Software</option>
                                    <option>Legal/Professional</option>
                                    <option>Marketing/Ads</option>
                                    <option>Withdrawal Fees</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button" onClick={() => setIsAddOpen(false)}
                                    className="flex-1 py-3 font-bold text-muted hover:text-foreground transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 premium-button py-3">
                                    Guardar Gasto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ComplianceTaskProps {
    title: string;
    date: string;
    desc: string;
    status: 'pending' | 'completed';
}

function ComplianceTask({ title, date, desc, status }: ComplianceTaskProps) {
    return (
        <div className={`p-5 premium-card ${status === 'completed' ? 'opacity-60 grayscale' : 'ring-1 ring-primary/20'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-primary tracking-widest">{date}</span>
                {status === 'completed' ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Hecho
                    </span>
                ) : (
                    <span className="text-[10px] font-black text-yellow-500 uppercase px-2 py-1 bg-yellow-500/10 rounded">
                        Pendiente
                    </span>
                )}
            </div>
            <h4 className="font-bold text-lg">{title}</h4>
            <p className="text-sm text-muted mt-1 leading-relaxed">{desc}</p>
        </div>
    );
}


