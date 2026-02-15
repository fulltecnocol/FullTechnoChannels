import { ShieldEllipsis, Users, LayoutGrid, Zap, History, ShieldCheck, Wallet, LifeBuoy, AlertTriangle, Trash2, Eye, X, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { UserAdmin, ConfigItem, Withdrawal, SupportTicket, LegalInfo } from '@/lib/types';
import { useState, useEffect } from 'react';
import { adminApi, API_URL } from '@/lib/api';

interface AdminSystemProps {
    adminUsers: UserAdmin[];
    configs: ConfigItem[];
    handleConfigUpdate: (key: string, value: number) => void;
    handleDeleteUser: (id: number) => void;
    adminWithdrawals: Withdrawal[];
    handleProcessWithdrawal: (id: number, status: string) => void;
    adminTickets: SupportTicket[];
    handleOpenTicket: (id: number, isAdmin: boolean) => void;
    setActiveTab: (tab: string) => void;
    mounted: boolean;
}

export function AdminSystem({
    adminUsers, configs, handleConfigUpdate, handleDeleteUser, adminWithdrawals, handleProcessWithdrawal,
    adminTickets, handleOpenTicket, setActiveTab, mounted
}: AdminSystemProps) {
    const [localConfigs, setLocalConfigs] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [selectedLegal, setSelectedLegal] = useState<LegalInfo | null>(null);
    const [isLegalLoading, setIsLegalLoading] = useState(false);

    useEffect(() => {
        const initialConfigs: Record<string, number> = {};
        configs.forEach(c => {
            initialConfigs[c.key] = c.value;
        });
        setLocalConfigs(initialConfigs);
    }, [configs]);

    const handleLocalChange = (key: string, value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setLocalConfigs(prev => ({ ...prev, [key]: num }));
        }
    };

    const triggerSave = async (key: string) => {
        setIsSaving(key);
        try {
            await handleConfigUpdate(key, localConfigs[key]);
        } finally {
            setIsSaving(null);
        }
    };

    const viewLegal = async (userId: number) => {
        setIsLegalLoading(true);
        try {
            const info = await adminApi.getUserLegalInfo(userId);
            setSelectedLegal(info);
        } catch (err) {
            alert("Error al cargar información legal");
        } finally {
            setIsLegalLoading(false);
        }
    };
    return (
        <div className="space-y-10 animate-fade-in">
            <header>
                <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <ShieldEllipsis className="w-8 h-8" /> Configuración Maestro del Sistema
                </h2>
                <p className="text-muted font-medium">Controla las comisiones, umbrales y usuarios de todo el SaaS.</p>
            </header>

            {/* Gestión de Usuarios (Admin) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Users className="w-6 h-6" /> Gestión de Propietarios (Owners)
                </h3>
                <div className="premium-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-background/50 text-[10px] font-black uppercase tracking-widest text-muted border-b border-surface-border">
                                <th className="p-5">Usuario / Email</th>
                                <th className="p-5">ID</th>
                                <th className="p-5">Firma Legal</th>
                                <th className="p-5">Fecha Registro</th>
                                <th className="p-5">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {adminUsers.map(u => (
                                <tr key={u.id} className="hover:bg-background/30 transition-colors">
                                    <td className="p-5">
                                        <p className="font-bold text-sm">{u.full_name || 'Sin Nombre'}</p>
                                        <p className="text-[10px] text-muted">{u.email}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-2 py-0.5 bg-surface-border text-muted text-[10px] font-black rounded">#{u.id}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter border ${u.legal_verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            u.legal_verification_status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {u.legal_verification_status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                            {(u.legal_verification_status || 'PENDING').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-xs font-medium text-muted">{mounted ? new Date(u.created_at).toLocaleDateString() : '...'}</p>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => viewLegal(u.id)}
                                                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                                                title="Ver Documentos Legales"
                                            >
                                                {isLegalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("¿Estás seguro de eliminar este propietario? Esta acción es irreversible.")) {
                                                        handleDeleteUser(u.id);
                                                    }
                                                }}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta de Comisión Plataforma */}
                <div className="premium-card p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <LayoutGrid className="w-5 h-5" /> Comisión Plataforma
                    </div>
                    <p className="text-xs text-muted">El porcentaje total que se retiene de cada pago (ej: 0.10 para 10%).</p>
                    <div className="flex gap-2">
                        <input
                            type="number" step="0.01"
                            value={localConfigs["platform_fee"] ?? 0.10}
                            onChange={(e) => handleLocalChange("platform_fee", e.target.value)}
                            className="flex-1 p-3 bg-background rounded-xl border border-surface-border text-lg font-bold min-w-0"
                        />
                        <button
                            onClick={() => triggerSave("platform_fee")}
                            disabled={isSaving === "platform_fee"}
                            className="px-6 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-tighter text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2"
                        >
                            {isSaving === "platform_fee" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <ShieldCheck className="w-4 h-4" /> Guardar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Configuración Multinivel (10 Niveles) */}
                <div className="md:col-span-2 lg:col-span-3 premium-card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                                <Zap className="w-6 h-6" /> Comisiones Multinivel (10 Profundidades)
                            </h3>
                            <p className="text-sm text-muted">Define el % que gana cada nivel en la cadena de referidos.</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-black">
                            ACTIVO: MLM DEPTH 10
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { lv: 1, n: "Directo" }, { lv: 2, n: "Gen II" }, { lv: 3, n: "Gen III" },
                            { lv: 4, n: "C. Interno" }, { lv: 5, n: "Liderazgo" }, { lv: 6, n: "Elite" },
                            { lv: 7, n: "Embajador" }, { lv: 8, n: "Maestro" }, { lv: 9, n: "Leyenda" },
                            { lv: 10, n: "Infinitum" },
                        ].map((level) => (
                            <div key={level.lv} className="space-y-2 p-4 bg-background rounded-xl border border-surface-border">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">{level.n}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number" step="0.001"
                                        value={localConfigs[`affiliate_level_${level.lv}_fee`] ?? (level.lv === 1 ? 0.03 : 0.001)}
                                        onChange={(e) => handleLocalChange(`affiliate_level_${level.lv}_fee`, e.target.value)}
                                        className="flex-1 p-2 bg-surface-border/30 rounded-lg text-sm font-bold focus:ring-1 ring-primary outline-none"
                                    />
                                    <button
                                        onClick={() => triggerSave(`affiliate_level_${level.lv}_fee`)}
                                        disabled={isSaving === `affiliate_level_${level.lv}_fee`}
                                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
                                    >
                                        {isSaving === `affiliate_level_${level.lv}_fee` ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Tiers Visuales / Umbrales & Comisiones */}
                {[
                    { key: "tier_gold_min", label: "Referidos para Oro", desc: "Requisito para insignia Oro.", step: 1 },
                    { key: "tier_diamond_min", label: "Referidos para Diamante", desc: "Requisito para insignia Diamante.", step: 1 },
                    { key: "affiliate_level_1_fee_gold", label: "Comisión Nivel 1 (Oro)", desc: "Porcentaje para usuarios Oro (Ej: 0.05).", step: 0.01 },
                    { key: "affiliate_level_1_fee_diamond", label: "Comisión Nivel 1 (Diamante)", desc: "Porcentaje para usuarios Diamante (Ej: 0.08).", step: 0.01 },
                ].map((config) => (
                    <div key={config.key} className="premium-card p-6 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <History className="w-5 h-5" /> {config.label}
                        </div>
                        <p className="text-xs text-muted">{config.desc}</p>
                        <div className="flex gap-2">
                            <input
                                type="number" step={config.step}
                                value={localConfigs[config.key] ?? 0}
                                onChange={(e) => handleLocalChange(config.key, e.target.value)}
                                className="flex-1 p-3 bg-background rounded-xl border border-surface-border text-lg font-bold min-w-0"
                            />
                            <button
                                onClick={() => triggerSave(config.key)}
                                disabled={isSaving === config.key}
                                className="px-6 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-tighter text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2"
                            >
                                {isSaving === config.key ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" /> Guardar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Nota de Seguridad
                </p>
                <p className="text-xs text-amber-500/80 mt-1">
                    Los cambios en los porcentajes se aplicarán a todas las transacciones nuevas a partir de este momento. El historial de pagos anteriores no se modificará.
                </p>
            </div>

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
            {/* Modal de Información Legal */}
            {selectedLegal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 relative">
                        <button
                            onClick={() => setSelectedLegal(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-surface-border rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <header className="mb-8">
                            <h3 className="text-2xl font-black flex items-center gap-2 text-primary">
                                <FileText className="w-8 h-8" /> Expediente Legal de Propietario
                            </h3>
                            <p className="text-muted font-medium">Información corporativa y documentos cargados.</p>
                        </header>

                        {!selectedLegal.has_legal ? (
                            <div className="p-10 text-center bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <p className="font-bold text-amber-500">Este usuario aún no ha completado su perfil legal.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest">Nombre Legal / Razón Social</label>
                                        <p className="font-bold text-lg">{selectedLegal.person_type === 'natural' ? selectedLegal.full_legal_name : selectedLegal.business_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest">Identificación / NIT</label>
                                        <p className="font-bold text-lg">{selectedLegal.person_type === 'natural' ? `${selectedLegal.id_type} ${selectedLegal.id_number}` : selectedLegal.nit}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest">Contacto</label>
                                        <p className="font-bold">{selectedLegal.phone}</p>
                                        <p className="text-sm text-muted">{selectedLegal.address}, {selectedLegal.city}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest">Información Bancaria</label>
                                        <p className="font-bold">{selectedLegal.bank_name}</p>
                                        <p className="text-sm text-muted">{selectedLegal.account_type?.toUpperCase()} #{selectedLegal.account_number}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-black text-sm uppercase tracking-widest text-primary border-b border-surface-border pb-2">Documentación Anexa</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedLegal.rut_url && (
                                            <a href={selectedLegal.rut_url} target="_blank" className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-xl hover:bg-surface-border transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                    <span className="text-sm font-bold">Registro RUT</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                                            </a>
                                        )}
                                        {selectedLegal.bank_cert_url && (
                                            <a href={selectedLegal.bank_cert_url} target="_blank" className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-xl hover:bg-surface-border transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                    <span className="text-sm font-bold">Certificación Bancaria</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                                            </a>
                                        )}
                                        {selectedLegal.chamber_commerce_url && (
                                            <a href={selectedLegal.chamber_commerce_url} target="_blank" className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-xl hover:bg-surface-border transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <Zap className="w-5 h-5 text-amber-500" />
                                                    <span className="text-sm font-bold">Cámara de Comercio</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                                            </a>
                                        )}
                                        {selectedLegal.contract_pdf_url && (
                                            <a
                                                href={`/api${selectedLegal.contract_pdf_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold">Contrato Firmado</span>
                                                        <span className="text-[10px] text-muted">Firmado el {new Date(selectedLegal.signed_at!).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
