"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Video } from "lucide-react";

interface Dictionary {
    [key: string]: any;
}

export default function CallsManagement() {
    const { user, token, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<Dictionary>({
        price: 0,
        duration_minutes: 30,
        description: "",
        is_active: false,
        slots: [],
    });

    // New Slot State
    const [newSlotDate, setNewSlotDate] = useState("");
    const [newSlotTime, setNewSlotTime] = useState("");

    const fetchConfig = async () => {
        try {
            if (!token) return;
            const data = await apiRequest<Dictionary>('/calls/config');
            setConfig(data);
        } catch (error) {
            console.error(error);
            // toast.error("Error cargando configuración"); // apiRequest throws, caught here
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (token) {
                fetchConfig();
            } else {
                setLoading(false); // Stop loading if no token available
            }
        }
    }, [token, authLoading]);

    const handleSaveConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calls/config`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    price: parseFloat(config.price),
                    duration_minutes: parseInt(config.duration_minutes),
                    description: config.description,
                    is_active: config.is_active
                }),
            });

            if (res.ok) {
                toast.success("Configuración guardada");
                fetchConfig();
            } else {
                toast.error("Error al guardar");
            }
        } catch (e) {
            toast.error("Error de conexión");
        }
    };

    const handleAddSlot = async () => {
        if (!newSlotDate || !newSlotTime) return;

        // Combine date and time to ISO string
        const start_time = new Date(`${newSlotDate}T${newSlotTime}:00`).toISOString();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calls/slots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify([{ start_time }]),
            });

            if (res.ok) {
                toast.success("Horario agregado");
                setNewSlotDate("");
                setNewSlotTime("");
                fetchConfig();
            }
        } catch (e) {
            toast.error("Error agregando horario");
        }
    };

    const handleDeleteSlot = async (id: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calls/slots/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success("Horario eliminado");
                fetchConfig();
            }
        } catch (e) {
            toast.error("Error eliminando slot");
        }
    }

    if (loading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Video className="w-6 h-6 text-purple-500" />
                        Venta de Llamadas Privadas
                    </h2>
                    <p className="text-gray-400">Configura tus sesiones 1 a 1 con suscriptores.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CONFIGURATION CARD */}
                <Card className="p-6 space-y-4 bg-gray-900 border-gray-800">
                    <h3 className="font-semibold text-lg">⚙️ Configuración General</h3>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active-mode"
                            checked={config.is_active}
                            onCheckedChange={(c) => setConfig({ ...config, is_active: c })}
                        />
                        <Label htmlFor="active-mode">Habilitar Venta de Llamadas</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Precio (USD)</Label>
                            <Input
                                type="number"
                                value={config.price}
                                onChange={(e) => setConfig({ ...config, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Duración (Minutos)</Label>
                            <Input
                                type="number"
                                value={config.duration_minutes}
                                onChange={(e) => setConfig({ ...config, duration_minutes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción Pública</Label>
                        <Input
                            value={config.description || ""}
                            onChange={(e) => setConfig({ ...config, description: e.target.value })}
                            placeholder="Ej: Asesoría privada de 30 min..."
                        />
                    </div>

                    <Button onClick={handleSaveConfig} className="w-full bg-purple-600 hover:bg-purple-700">
                        Guardar Cambios
                    </Button>
                </Card>

                {/* SCHEDULER CARD */}
                <Card className="p-6 space-y-4 bg-gray-900 border-gray-800">
                    <h3 className="font-semibold text-lg">📅 Disponibilidad</h3>
                    <p className="text-sm text-gray-400">Agrega bloques de tiempo disponibles.</p>

                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={newSlotDate}
                            onChange={(e) => setNewSlotDate(e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            type="time"
                            value={newSlotTime}
                            onChange={(e) => setNewSlotTime(e.target.value)}
                            className="w-32"
                        />
                        <Button onClick={handleAddSlot} size="icon" variant="secondary">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
                        {config.slots?.length === 0 && <p className="text-sm text-gray-500 italic">No hay horarios disponibles.</p>}

                        {config.slots?.filter((s: any) => !s.is_booked).map((slot: any) => (
                            <div key={slot.id} className="flex justify-between items-center p-2 bg-gray-800 rounded border border-gray-700">
                                <div className="flex flex-col">
                                    <span className="font-medium text-white">
                                        {new Date(slot.start_time).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm text-purple-400">
                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* BOOKINGS HISTORY */}
            <Card className="p-6 bg-gray-900 border-gray-800">
                <h3 className="font-semibold text-lg mb-4">✅ Próximas Sesiones (Vendidas)</h3>
                <div className="space-y-2">
                    {config.slots?.filter((s: any) => s.is_booked).length === 0 && (
                        <p className="text-gray-500">Aún no tienes ventas.</p>
                    )}
                    {config.slots?.filter((s: any) => s.is_booked).map((slot: any) => (
                        <div key={slot.id} className="flex justify-between items-center p-3 bg-green-900/20 border border-green-800 rounded">
                            <div>
                                <span className="font-bold text-green-400">
                                    {new Date(slot.start_time).toLocaleString()}
                                </span>
                                <p className="text-sm text-gray-300">Link: <a href={slot.jitsi_link} target="_blank" className="underline hover:text-white">{slot.jitsi_link}</a></p>
                            </div>
                            <div className="bg-green-600 text-xs px-2 py-1 rounded text-white">VENDIDO</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
