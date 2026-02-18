
import { ShieldEllipsis, Users, LayoutGrid, Zap, History, ShieldCheck, Wallet, LifeBuoy, AlertTriangle, CheckCircle2, Search, Trash2, Edit, FileText, X } from 'lucide-react';
import { UserAdmin, Withdrawal, SupportTicket } from '@/lib/types';
import { useState, useMemo } from 'react';
import { adminApi } from '@/lib/api';

interface AdminSystemProps {
    adminUsers: UserAdmin[];
    adminWithdrawals: Withdrawal[];
    handleProcessWithdrawal: (id: number, status: string) => void;
    adminTickets: SupportTicket[];
    handleOpenTicket: (id: number, isAdmin: boolean) => void;
    setActiveTab: (tab: string) => void;
    mounted: boolean;
}

export function AdminSystem({
    adminUsers: initialUsers, adminWithdrawals, handleProcessWithdrawal,
    adminTickets, handleOpenTicket, setActiveTab, mounted
}: AdminSystemProps) {

    // Local state for optimistic updates
    const [users, setUsers] = useState<UserAdmin[]>(initialUsers);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    // Modals
    const [viewingUser, setViewingUser] = useState<UserAdmin | null>(null);
    const [editingUplink, setEditingUplink] = useState<UserAdmin | null>(null);
    const [newReferrerId, setNewReferrerId] = useState("");

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lower = searchTerm.toLowerCase();
        return users.filter(u =>
            (u.full_name?.toLowerCase().includes(lower)) ||
            (u.email?.toLowerCase().includes(lower)) ||
            (u.id.toString().includes(lower))
        );
    }, [users, searchTerm]);

    // Handlers
    const toggleSelectUser = (id: number) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("¿ESTAS SEGURO? Esta acción borrará al usuario y toda su data dependiente.")) return;
        try {
            await adminApi.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
            if (viewingUser?.id === id) setViewingUser(null);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Eliminar ${selectedUsers.length} usuarios seleccionados? IRREVERSIBLE.`)) return;
        try {
            // Execute in parallel
            await Promise.all(selectedUsers.map(id => adminApi.deleteUser(id)));
            setUsers(users.filter(u => !selectedUsers.includes(u.id)));
            setSelectedUsers([]);
            alert("Usuarios eliminados correctamente.");
        } catch (e: any) {
            alert("Error eliminando algunos usuarios: " + e.message);
            // Refresh list from server ideally, but local update is okay for now
        }
    };

    const handleUpdateUplink = async () => {
        if (!editingUplink || !newReferrerId) return;
        try {
            await adminApi.updateUplink(editingUplink.id, parseInt(newReferrerId));
            alert("Referidor actualizado");
            // Optimistic update
            setUsers(users.map(u => u.id === editingUplink.id ? { ...u, referred_by_id: parseInt(newReferrerId) } : u));
            setEditingUplink(null);
            setNewReferrerId("");
        } catch (e: any) {
            alert(e.message);
        }
    }

    const handleDownloadContract = async (userId: number) => {
        try {
            const blob = await adminApi.getSignedContract(userId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contract_${userId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e: any) {
            alert("No se pudo descargar el contrato (¿Quizás no existe o no está firmado?)");
        }
    };

    return (
        <div className="space-y-10 animate-fade-in text-sm">
            <header>
                <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <ShieldEllipsis className="w-8 h-8" /> Gestión Operativa del Sistema
                </h2>
                <p className="text-muted font-medium">Administración de usuarios, retiros y soporte técnico.</p>
            </header>

            {/* Gestión de Usuarios (Admin) */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                        <Users className="w-6 h-6" /> Gestión de Propietarios (Owners)
                    </h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o ID..."
                                className="w-full pl-9 pr-4 py-2 bg-background border border-surface-border rounded-lg text-sm focus:ring-1 ring-primary outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {selectedUsers.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 font-bold text-xs"
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar ({selectedUsers.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="premium-card overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-[10px] font-black uppercase tracking-widest text-muted border-b border-surface-border">
                                <th className="p-4 w-10">
                                    <input type="checkbox"
                                        checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                        ref={input => { if (input) input.indeterminate = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length; }}
                                        onChange={toggleSelectAll}
                                        className="rounded border-surface-border bg-background checked:bg-primary"
                                    />
                                </th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">ID</th>
                                <th className="p-4">Referido Por</th>
                                <th className="p-4">Legal</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <tr key={u.id} className={`hover:bg-background/30 transition-colors ${selectedUsers.includes(u.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="p-4">
                                        <input type="checkbox"
                                            checked={selectedUsers.includes(u.id)}
                                            onChange={() => toggleSelectUser(u.id)}
                                            className="rounded border-surface-border bg-background checked:bg-primary"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground">{u.full_name || 'Sin Nombre'}</span>
                                            <span className="text-[10px] text-muted">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-1.5 py-0.5 bg-surface-border text-muted text-[10px] font-black rounded">#{u.id}</span>
                                    </td>
                                    <td className="p-4">
                                        {u.referred_by_id ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-400">{u.referrer_name || `ID: ${u.referred_by_id}`}</span>
                                                <span className="text-[9px] text-muted">ID: {u.referred_by_id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted/50 italic">Sin upline</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${u.legal_verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            u.legal_verification_status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-surface-border text-muted border-surface-border'
                                            }`}>
                                            {u.legal_verification_status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : u.legal_verification_status === 'pending' ? <AlertTriangle className="w-3 h-3" /> : null}
                                            {u.legal_verification_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setViewingUser(u)} className="p-1.5 hover:bg-surface-border rounded-lg text-muted hover:text-foreground transition-colors" title="Ver Detalles">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setEditingUplink(u); setNewReferrerId(u.referred_by_id?.toString() || ""); }} className="p-1.5 hover:bg-surface-border rounded-lg text-muted hover:text-emerald-400 transition-colors" title="Editar Referidor">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-500 transition-colors" title="Eliminar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted font-medium text-xs">
                                        No se encontraron usuarios con esos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#12141C] border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
                        <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 text-muted hover:text-white"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-bold mb-1">Detalles de Usuario</h3>
                        <p className="text-xs text-muted mb-6">ID: {viewingUser.id} · Creado: {new Date(viewingUser.created_at).toLocaleDateString()}</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-background rounded-xl border border-surface-border">
                                    <label className="text-[10px] uppercase font-black text-muted">Nombre</label>
                                    <p className="font-bold text-sm">{viewingUser.full_name}</p>
                                </div>
                                <div className="p-3 bg-background rounded-xl border border-surface-border">
                                    <label className="text-[10px] uppercase font-black text-muted">Email</label>
                                    <p className="font-bold text-sm truncate">{viewingUser.email}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-xl border border-surface-border space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase font-black text-muted">Estado Legal</label>
                                    <span className={`text-xs font-bold ${viewingUser.legal_verification_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {viewingUser.legal_verification_status.toUpperCase()}
                                    </span>
                                </div>
                                {/* Document Links - Always visible if they exist */}
                                <div className="space-y-2 pt-2 border-t border-surface-border/50">
                                    <div className="grid grid-cols-2 gap-2">
                                        {viewingUser.rut_url && (
                                            <a href={viewingUser.rut_url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-background border border-surface-border rounded-lg text-[10px] font-bold hover:text-primary flex items-center gap-1.5 transition-colors">
                                                <FileText className="w-3 h-3" /> Ver RUT
                                            </a>
                                        )}
                                        {viewingUser.bank_cert_url && (
                                            <a href={viewingUser.bank_cert_url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-background border border-surface-border rounded-lg text-[10px] font-bold hover:text-primary flex items-center gap-1.5 transition-colors">
                                                <FileText className="w-3 h-3" /> Cert. Bancario
                                            </a>
                                        )}
                                        {viewingUser.chamber_commerce_url && (
                                            <a href={viewingUser.chamber_commerce_url} target="_blank" rel="noreferrer" className="col-span-2 px-3 py-2 bg-background border border-surface-border rounded-lg text-[10px] font-bold hover:text-primary flex items-center gap-1.5 transition-colors justify-center">
                                                <FileText className="w-3 h-3" /> Cámara de Comercio
                                            </a>
                                        )}
                                    </div>

                                    {/* Contract - Only if verified or we have a way to know it exists. For now kept with verified or if we assume it might exist. 
                                        Let's show it always, backend handles 404. 
                                    */}
                                    {/* Contract */}
                                    <button
                                        onClick={() => viewingUser.contract_signed && handleDownloadContract(viewingUser.id)}
                                        disabled={!viewingUser.contract_signed}
                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${viewingUser.contract_signed
                                            ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer'
                                            : 'bg-surface-border/50 text-muted border border-surface-border cursor-not-allowed'
                                            }`}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        {viewingUser.contract_signed ? "Descargar Contrato Firmado" : "Contrato No Firmado"}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-xl border border-surface-border">
                                <label className="text-[10px] uppercase font-black text-muted mb-2 block">Referidor (Upline)</label>
                                {viewingUser.referred_by_id ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                            {viewingUser.referrer_name?.charAt(0) || '#'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{viewingUser.referrer_name}</p>
                                            <p className="text-[10px] text-muted">ID: {viewingUser.referred_by_id}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-muted">Sin upline asignado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingUplink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#12141C] border border-surface-border rounded-xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Editar Referidor</h3>
                        <p className="text-xs text-muted mb-4">
                            Estás cambiando el upline para <strong>{editingUplink.full_name}</strong>. Esto moverá toda su red descendente.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-muted mb-1 block">Nuevo ID de Referidor</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-background border border-surface-border rounded-lg"
                                    placeholder="Ej: 105"
                                    value={newReferrerId}
                                    onChange={(e) => setNewReferrerId(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setEditingUplink(null)} className="flex-1 py-2 bg-surface-border text-foreground rounded-lg font-bold text-sm">Cancelar</button>
                                <button onClick={handleUpdateUplink} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm">Guardar Cambios</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Gestión de Retiros (Admin) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Wallet className="w-6 h-6" /> Gestión de Retiros Pendientes
                </h3>
                {adminWithdrawals.filter(w => w.status === 'pending').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {adminWithdrawals.filter(w => w.status === 'pending').map(w => (
                            <div key={w.id} className="premium-card p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-2xl font-black text-primary">${w.amount.toFixed(2)}</p>
                                        <p className="text-xs text-muted font-bold">Solicitado por ID: {w.owner_id}</p>
                                        <p className="text-[10px] text-muted">{mounted ? new Date(w.created_at).toLocaleString() : '...'}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold uppercase">Pendiente</span>
                                </div>
                                <div className="p-3 bg-background rounded-lg border border-surface-border">
                                    <p className="text-[10px] font-black uppercase text-muted">Método & Detalles</p>
                                    <p className="text-xs font-bold">{w.method}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{w.details}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProcessWithdrawal(w.id, "completed")}
                                        className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleProcessWithdrawal(w.id, "rejected")}
                                        className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center premium-card border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-sm font-bold text-emerald-500">No hay retiros pendientes por procesar. ✨</p>
                    </div>
                )}
            </div>

            {/* Cola de Soporte (Admin) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <LifeBuoy className="w-6 h-6" /> Cola de Tickets de Soporte
                </h3>
                <div className="premium-card divide-y divide-surface-border overflow-hidden">
                    {adminTickets.length > 0 ? adminTickets.map(t => (
                        <div
                            key={t.id}
                            onClick={() => {
                                setActiveTab("support");
                                handleOpenTicket(t.id, true);
                            }}
                            className="p-4 flex items-center justify-between hover:bg-background/50 cursor-pointer transition-all"
                        >
                            <div>
                                <p className="font-bold text-sm">{t.subject}</p>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                    Usuario ID: {t.user_id} · {mounted ? new Date(t.created_at).toLocaleDateString() : '...'}
                                </p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${t.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-surface-border text-muted border-surface-border'
                                }`}>
                                {t.status === 'open' ? 'Responder' : t.status === 'pending' ? 'En espera' : 'Cerrado'}
                            </span>
                        </div>
                    )) : (
                        <div className="p-10 text-center text-xs text-muted font-bold">No hay tickets hoy. Todo en orden.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
