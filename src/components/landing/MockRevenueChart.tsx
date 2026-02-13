
"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid } from "recharts";

export function MockRevenueChart() {
    const data = useMemo(() => [
        { value: 1000 }, { value: 1500 }, { value: 3000 }, { value: 2500 },
        { value: 4000 }, { value: 3500 }, { value: 5000 }, { value: 6500 },
        { value: 8000 }, { value: 7500 }, { value: 9000 }, { value: 12000 },
    ], []);

    return (
        <div className="w-full h-full bg-surface border border-surface-border rounded-xl p-4 flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold text-muted">Ingresos Totales</h3>
                    <p className="text-2xl font-black text-white">$12,450.00</p>
                </div>
                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded">
                    +15%
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValueMock" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C6A664" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#C6A664" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#C6A664"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValueMock)"
                            isAnimationActive={true}
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
