import { LifeBuoy, MessageSquare } from 'lucide-react';
import { SupportTicketItem } from '@/lib/types';

interface SupportSectionProps {
    tickets: SupportTicketItem[];
    isAdmin: boolean;
    onAdminViewTicket: (ticketId: number) => void;
    // TODO: Add onUserCreateTicket or similar if needed for users
}

export function SupportSection({ tickets, isAdmin, onAdminViewTicket }: SupportSectionProps) {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="premium-card p-8 bg-surface/50 border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <LifeBuoy className="w-40 h-40 text-primary" />
                </div>

                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <LifeBuoy className="w-6 h-6 text-primary" /> Centro de Soporte
                </h2>
                <p className="text-muted font-medium mt-2 max-w-2xl">
                    {isAdmin
                        ? "Gestiona los tickets de soporte de los usuarios."
                        : "¿Tienes algún problema o duda? Abre un ticket y nuestro equipo te ayudará lo antes posible."
                    }
                </p>
            </div>

            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-surface-border text-left">
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">ID</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Asunto</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Estado</th>
                                <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Última Actualización</th>
                                {isAdmin && <th className="p-4 font-black text-muted uppercase text-[10px] tracking-wider">Acción</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {tickets.length > 0 ? tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-muted">#{ticket.id.toString().slice(0, 8)}</td>
                                    <td className="p-4 font-bold text-foreground">{ticket.subject}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                            }`}>
                                            {ticket.status === 'open' ? 'Abierto' : ticket.status === 'closed' ? 'Cerrado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted font-medium">{new Date(ticket.updated_at).toLocaleDateString()}</td>
                                    {isAdmin && (
                                        <td className="p-4">
                                            <button
                                                onClick={() => onAdminViewTicket(ticket.id)}
                                                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-bold text-xs flex items-center gap-1"
                                            >
                                                <MessageSquare className="w-3 h-3" /> Ver
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="p-20 text-center space-y-4">
                                        <LifeBuoy className="w-12 h-12 text-muted mx-auto opacity-20" />
                                        <p className="text-muted font-bold">No hay tickets de soporte activos.</p>
                                        {!isAdmin && (
                                            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20">
                                                Crear Nuevo Ticket
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                    {tickets.length > 0 ? tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 bg-background border border-surface-border rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-muted">#{ticket.id.toString().slice(0, 8)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}>
                                    {ticket.status === 'open' ? 'Abierto' : ticket.status === 'closed' ? 'Cerrado' : 'Pendiente'}
                                </span>
                            </div>

                            <h3 className="font-bold text-foreground text-sm">{ticket.subject}</h3>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted font-bold">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                {isAdmin && (
                                    <button
                                        onClick={() => onAdminViewTicket(ticket.id)}
                                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-bold text-xs flex items-center gap-1"
                                    >
                                        <MessageSquare className="w-3 h-3" /> Ver
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center space-y-4">
                            <LifeBuoy className="w-10 h-10 text-muted mx-auto opacity-20" />
                            <p className="text-muted font-bold text-sm">No hay tickets de soporte.</p>
                            {!isAdmin && (
                                <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 text-xs">
                                    Crear Ticket
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
