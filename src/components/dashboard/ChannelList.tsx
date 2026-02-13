import { Users, Megaphone, ArrowRight, Settings } from 'lucide-react';

interface ChannelListProps {
    channels: any[];
    onEditBranding: (channel: any) => void;
    onManagePromos: (channel: any) => void;
    onViewSubscribers: (channelId: string) => void;
    onLinkChannel: (channel: any) => void;
    isLoading: boolean;
}

export function ChannelList({ channels, onEditBranding, onManagePromos, onViewSubscribers, onLinkChannel, isLoading }: ChannelListProps) {
    if (isLoading) {
        return <div className="p-10 text-center text-muted animate-pulse">Cargando canales...</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {channels.map((channel) => (
                <div key={channel.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center shrink-0 border border-surface-border relative overflow-hidden">
                            {channel.logo_url ? (
                                <img src={channel.logo_url} alt={channel.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-muted opacity-30">{channel.title.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                {channel.title}
                                {channel.is_verified ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] uppercase tracking-widest font-black border border-emerald-500/20">
                                        Verificado
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] uppercase tracking-widest font-black border border-amber-500/20 animate-pulse">
                                        Pendiente Link
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-xs font-bold text-muted">
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {channel.subscriber_count || 0} Subs</span>
                                <span className="w-1 h-1 rounded-full bg-surface-border" />
                                <span>${channel.monthly_price} / mes</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón ¿Cómo vincular? si no está verificado */}
                        {!channel.is_verified && (
                            <button
                                onClick={() => onLinkChannel(channel)}
                                // En el original page.tsx, usaba: setIsAddingChannel(true); setNewChannelStep(2); setCreatedChannel(channel);
                                // Aquí lo ideal es que el padre maneje esto.
                                // Voy a asumir que el padre pasará una función para "continuar vinculación".
                                // Como no tengo esa prop en la interfaz, usaré onEditBranding temporalmente o añadiré una nueva prop.
                                // Mejor: añadiré una prop onContinueLinking.
                                className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-2"
                            >
                                ¿Cómo vincular?
                            </button>
                        )}


                        <button
                            onClick={() => onManagePromos(channel)}
                            className="p-2.5 text-muted hover:text-primary bg-surface hover:bg-surface-border rounded-xl transition-all tooltip-trigger"
                            title="Gestionar Ofertas"
                        >
                            <Megaphone className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onEditBranding(channel)}
                            className="p-2.5 text-muted hover:text-primary bg-surface hover:bg-surface-border rounded-xl transition-all"
                            title="Editar Branding"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewSubscribers(channel.id)}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            Ver Suscriptores <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
