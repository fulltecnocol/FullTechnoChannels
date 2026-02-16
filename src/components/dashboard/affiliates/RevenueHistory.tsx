import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, DollarSign, Clock } from 'lucide-react';

interface RevenueHistoryProps {
    history: {
        id: number;
        amount: number;
        level: number;
        date: string;
        source_user: string;
    }[];
}

export function RevenueHistory({ history }: RevenueHistoryProps) {
    if (!history || history.length === 0) {
        return <div className="p-6 text-center text-zinc-500 text-sm">No hay actividad reciente</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="text-zinc-500 border-b border-surface-border">
                        <th className="pb-3 pl-4 font-bold uppercase tracking-wider">Usuario Origen</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Nivel</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Fecha</th>
                        <th className="pb-3 pr-4 text-right font-bold uppercase tracking-wider">Comisión</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                    {history.map((item) => (
                        <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-3 pl-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                        <User className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold text-zinc-300">{item.source_user}</span>
                                </div>
                            </td>
                            <td className="py-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono font-bold">
                                    L{item.level}
                                </span>
                            </td>
                            <td className="py-3 text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(item.date), "d MMM, HH:mm", { locale: es })}
                                </div>
                            </td>
                            <td className="py-3 pr-4 text-right">
                                <span className="text-emerald-500 font-bold font-mono">
                                    +${item.amount.toFixed(2)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
