"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, GripVertical, Save, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { motion, Reorder } from "framer-motion";

interface ProfileLink {
    id: number;
    title: string;
    url: string;
    icon: string | null;
    is_active: boolean;
    order_index: number;
}

interface PublicProfile {
    id: number;
    slug: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    theme_color: string;
    is_published: boolean;
    links: ProfileLink[];
}

export default function LinkInBioPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Links Management
    const [links, setLinks] = useState<ProfileLink[]>([]);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLink, setNewLink] = useState({ title: "", url: "" });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await apiRequest<PublicProfile>("/owner/profile");
            setProfile(data);
            setLinks(data.links.sort((a, b) => a.order_index - b.order_index));
        } catch (error) {
            toast.error("Error cargando perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        try {
            await apiRequest("/owner/profile", {
                method: "PUT",
                body: JSON.stringify({
                    slug: profile.slug,
                    display_name: profile.display_name,
                    bio: profile.bio,
                    theme_color: profile.theme_color
                })
            });
            toast.success("Perfil actualizado");
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleAddLink = async () => {
        if (!newLink.title || !newLink.url) return;
        try {
            const addedLink = await apiRequest<ProfileLink>("/owner/links", {
                method: "POST",
                body: JSON.stringify(newLink)
            });
            setLinks([...links, addedLink]);
            setNewLink({ title: "", url: "" });
            setIsAddingLink(false);
            toast.success("Enlace agregado");
        } catch (error) {
            toast.error("Error agregando enlace");
        }
    };

    const handleDeleteLink = async (id: number) => {
        if (!confirm("¿Eliminar este enlace?")) return;
        try {
            await apiRequest(`/owner/links/${id}`, { method: "DELETE" });
            setLinks(links.filter(l => l.id !== id));
            toast.success("Enlace eliminado");
        } catch (error) {
            toast.error("Error eliminando enlace");
        }
    };

    const handleReorder = (newOrder: ProfileLink[]) => {
        setLinks(newOrder);
        // Debounce sync to backend could happen here
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!profile) return null;

    const publicUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${profile.slug}`;

    return (
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">

            {/* LEFT: EDITOR */}
            <div className="space-y-6 overflow-y-auto pr-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Editor de Perfil</h1>
                    <Button variant="outline" asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Ver página
                        </a>
                    </Button>
                </div>

                {/* Main Profile Info */}
                <Card>
                    <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>URL del Perfil</Label>
                                <div className="flex items-center">
                                    <span className="bg-muted px-3 py-2 rounded-l text-muted-foreground text-sm border border-r-0">
                                        fgate.co/
                                    </span>
                                    <Input
                                        value={profile.slug}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, slug: e.target.value })}
                                        className="rounded-l-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Nombre Visible</Label>
                                <Input
                                    value={profile.display_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, display_name: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Biografía</Label>
                                <Textarea
                                    value={profile.bio || ""}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, bio: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Color del Tema</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={profile.theme_color}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, theme_color: e.target.value })}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={profile.theme_color}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, theme_color: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Links Manager */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Enlaces</CardTitle>
                        <Button size="sm" onClick={() => setIsAddingLink(true)}><Plus className="w-4 h-4 mr-2" /> Nuevo</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {isAddingLink && (
                            <div className="p-4 border rounded-lg space-y-3 bg-muted/20 animate-in fade-in">
                                <Input
                                    placeholder="Título (Ej: Mi Instagram)"
                                    value={newLink.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLink({ ...newLink, title: e.target.value })}
                                    autoFocus
                                />
                                <Input
                                    placeholder="URL (https://...)"
                                    value={newLink.url}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLink({ ...newLink, url: e.target.value })}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingLink(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handleAddLink}>Agregar</Button>
                                </div>
                            </div>
                        )}

                        <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-2">
                            {links.map((link) => (
                                <Reorder.Item key={link.id} value={link} className="bg-card border rounded-lg p-3 flex items-center gap-3 shadow-sm select-none">
                                    <div className="cursor-grab text-muted-foreground"><GripVertical className="w-4 h-4" /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium truncate">{link.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteLink(link.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {links.length === 0 && !isAddingLink && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No tienes enlaces. ¡Agrega el primero!
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: PHONE PREVIEW */}
            <div className="hidden lg:flex items-center justify-center bg-muted/10 rounded-3xl border-4 border-muted p-8 relative">
                <div className="absolute top-0 left-0 w-full text-center py-4 font-bold text-muted-foreground opacity-50">Vista Previa</div>

                {/* Phone Mockup */}
                <div className="w-[375px] h-[750px] bg-black rounded-[40px] border-[8px] border-black overflow-hidden shadow-2xl relative">
                    {/* Dynamic Content */}
                    <div
                        className="w-full h-full overflow-y-auto"
                        style={{ backgroundColor: profile.theme_color, color: calculateContrast(profile.theme_color) }}
                    >
                        <div className="pt-16 pb-8 px-6 flex flex-col items-center gap-4">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border-2 border-white/20">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-white/10 uppercase">
                                        {profile.display_name[0]}
                                    </div>
                                )}
                            </div>

                            {/* Name & Bio */}
                            <div className="text-center">
                                <h2 className="text-xl font-bold">{profile.display_name}</h2>
                                {profile.bio && <p className="text-sm opacity-80 mt-1">{profile.bio}</p>}
                            </div>

                            {/* Links */}
                            <div className="w-full space-y-3 mt-4">
                                {links.map(link => (
                                    <a
                                        key={link.id}
                                        href="#" // Preview only
                                        className="block w-full py-4 px-6 text-center rounded-xl bg-white/10 hover:bg-white/20 hover:scale-[1.02] transition-all font-medium backdrop-blur-sm border border-white/5"
                                        onClick={e => e.preventDefault()}
                                    >
                                        {link.title}
                                    </a>
                                ))}
                            </div>

                            <div className="mt-12 text-xs opacity-50 flex items-center gap-1">
                                <div className="w-3 h-3 bg-white/20 rounded-full" />
                                Powered by FGate
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple contrast calculator for text color
function calculateContrast(hex: string) {
    // Default to white text
    if (!hex) return "#ffffff";
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}
