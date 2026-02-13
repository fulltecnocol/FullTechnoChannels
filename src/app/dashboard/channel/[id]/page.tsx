"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { ArrowLeft, Users, Shield, Calendar } from "lucide-react";

export default function ChannelDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [channel, setChannel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChannel = async () => {
            try {
                const channels = await ownerApi.getChannels();
                const found = channels.find((c: any) => c.id.toString() === params.id);
                if (found) setChannel(found);
                else {
                    // Don't redirect immediately to allow debugging if needed, or handle gracefully
                    console.error("Channel not found");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-muted font-bold">Cargando detalles del canal...</div>
        </div>
    );

    if (!channel) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Canal no encontrado</h1>
            <button onClick={() => router.back()} className="text-primary hover:underline font-bold">Volver al Dashboard</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-muted hover:text-foreground font-bold transition-colors">
                <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
            </button>

            <div className="premium-card p-8 border-primary/20 bg-primary/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden shadow-lg">
                            {channel.logo_url ? <img src={channel.logo_url} className="w-full h-full object-cover" alt={channel.title} /> : <span className="text-2xl font-black text-muted opacity-30">{channel.title.charAt(0)}</span>}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{channel.title}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${channel.is_verified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {channel.is_verified ? 'Verificado' : 'Pendiente de Vinculación'}
                                </span>
                                <span className="text-muted font-bold text-xs opacity-50">ID: {channel.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/80 transition-colors">
                    <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black tracking-tight">{channel.subscriber_count || 0}</span>
                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Suscriptores Activos</span>
                </div>

                <div className="premium-card p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/80 transition-colors">
                    <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500 mb-2">
                        <Shield className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black tracking-tight">${channel.monthly_price}</span>
                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Precio Mensual</span>
                </div>

                <div className="premium-card p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/80 transition-colors">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-500 mb-2">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-black tracking-tight text-muted-foreground">Mensual</span>
                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Frecuencia de Cobro</span>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Lista de Suscriptores
                </h3>
                <div className="premium-card p-16 text-center border-dashed border-surface-border bg-surface/30">
                    <Users className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-bold">Próximamente</h4>
                    <p className="text-muted font-medium mt-2 max-w-md mx-auto">
                        Estamos trabajando en la vista detallada de suscriptores para que puedas gestionar tu comunidad usuario por usuario.
                    </p>
                </div>
            </div>
        </div>
    );
}
