import { Settings, User, Lock, Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface ProfileSettingsProps {
    user: any;
    isRecovery: boolean;
    onUpdateProfile: (name: string, avatarUrl: string) => Promise<void>;
    onUpdatePassword: (oldPass: string, newPass: string, confirmTwice: string) => Promise<void>;
}

export function ProfileSettings({ user, isRecovery, onUpdateProfile, onUpdatePassword }: ProfileSettingsProps) {
    const [name, setName] = useState(user?.full_name || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Update local state when user prop changes (if initially null)
    // This simple check prevents wiping state if user is already loaded
    if (!name && user?.full_name) setName(user.full_name);
    if (!avatarUrl && user?.avatar_url) setAvatarUrl(user.avatar_url);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Perfil */}
            <div className="space-y-6">
                <div className="premium-card p-1 bg-gradient-to-br from-primary via-primary/50 to-amber-500 rounded-3xl">
                    <div className="bg-surface rounded-[22px] p-8 h-full space-y-8">
                        <div className="flex items-center gap-4 border-b border-surface-border pb-6">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Información Personal</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest">Tus datos públicos</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-surface-border relative overflow-hidden ring-4 ring-surface shadow-2xl">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-black">
                                            {name?.charAt(0) || user?.email?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu Nombre"
                                        className="w-full p-4 bg-background border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase">URL Avatar</label>
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full p-4 bg-background border border-surface-border rounded-xl font-medium text-sm outline-none focus:ring-1 ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2 opacity-50 pointer-events-none">
                                    <label className="text-xs font-bold text-muted uppercase">Email (No editable)</label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        readOnly
                                        className="w-full p-4 bg-background border border-surface-border rounded-xl font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => onUpdateProfile(name, avatarUrl)}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seguridad */}
            <div className="space-y-6">
                <div className="premium-card p-1 bg-gradient-to-br from-surface-border via-surface-border to-surface-border rounded-3xl">
                    <div className="bg-surface rounded-[22px] p-8 h-full space-y-8">
                        <div className="flex items-center gap-4 border-b border-surface-border pb-6">
                            <div className="p-3 bg-red-500/10 rounded-2xl">
                                <Lock className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Seguridad</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest">Actualizar contraseña</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {!isRecovery && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase">Contraseña Actual</label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full p-4 bg-background border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-red-500 transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full p-4 bg-background border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-red-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full p-4 bg-background border border-surface-border rounded-xl font-bold outline-none focus:ring-1 ring-red-500 transition-all"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (newPassword !== confirmPassword) return alert("Las contraseñas no coinciden");
                                    onUpdatePassword(oldPassword, newPassword, confirmPassword);
                                }}
                                className="w-full py-4 bg-surface-border text-foreground hover:bg-red-500 hover:text-white rounded-xl font-bold hover:shadow-xl hover:shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-5 h-5" /> Actualizar Seguridad
                            </button>

                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-[10px] text-primary font-medium leading-relaxed text-center">
                                    Usa una contraseña segura. No la compartas con nadie. El equipo de TeleGate nunca te pedirá tu contraseña.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
