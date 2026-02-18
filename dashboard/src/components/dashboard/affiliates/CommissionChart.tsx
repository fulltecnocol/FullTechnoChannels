import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CommissionChartProps {
    data: { level: number; amount: number }[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; color: string } }[] }) => {
    if (active && payload && payload.length) {
        const { name, value } = payload[0].payload;
        return (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-2 text-white text-xs font-bold">
                <p className="mb-1">{name}</p>
                <p className="text-zinc-300">Comisión: <span className="text-white">${(Number(value) || 0).toFixed(2)}</span></p>
            </div>
        );
    }
    return null;
};

export function CommissionChart({ data }: CommissionChartProps) {

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Group small levels into "Otros" if needed, or just map all
        // For 10 levels, displaying all in a donut is fine if colors are distinct enough

        const COLORS = [
            '#d4af37', // Gold 1
            '#b8860b', // Gold 2
            '#cd7f32', // Bronze
            '#a0522d', // Brown
            '#8b4513',
            '#555555',
            '#444444',
            '#333333',
            '#222222',
            '#111111'
        ];

        return data.map((item, index) => ({
            name: `Nivel ${item.level}`,
            value: item.amount,
            color: COLORS[index % COLORS.length]
        })).filter(d => d.value > 0);
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Sin datos de comisiones
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={<CustomTooltip />}
                    />
                    <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', color: '#999' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-24"> {/* pr-24 to offset legend */}
                <span className="text-xs text-zinc-500 font-bold uppercase">Total</span>
                <span className="text-xl font-black text-white">
                    ${chartData.reduce((acc, curr) => acc + curr.value, 0).toFixed(0)}
                </span>
            </div>
        </div>
    );
}
