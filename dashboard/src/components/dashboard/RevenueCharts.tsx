
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { AnalyticsData } from '@/lib/types';
import { TrendingUp, Users } from 'lucide-react';

interface RevenueChartsProps {
    analytics: AnalyticsData;
}

export function RevenueCharts({ analytics }: RevenueChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up delay-100">
            <div className="premium-card p-6 h-[400px] flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" /> Ingresos Recurrentes
                        </h3>
                        <p className="text-xs text-muted">Crecimiento de MRR últimos 30 días</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold animate-pulse">
                        +12.5% vs mes anterior
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.revenue_series || []}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                labelStyle={{ color: '#888', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="premium-card p-6 h-[400px] flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" /> Nuevos Suscriptores
                        </h3>
                        <p className="text-xs text-muted">Adquisición diaria por canal</p>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.subscriber_series || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="value" name="Suscriptores" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
