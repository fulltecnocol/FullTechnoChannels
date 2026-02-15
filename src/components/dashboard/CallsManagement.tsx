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
import { Loader2, Plus, Trash2, Video, Calendar as CalendarIcon } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface Dictionary {
    [key: string]: any;
}

interface Channel {
    id: number;
    title: string;
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

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");

    // New Slot State
    const [newSlotDate, setNewSlotDate] = useState<Date | undefined>(undefined);
    const [newSlotTime, setNewSlotTime] = useState("");

    // Recurring State
    const [recurringDays, setRecurringDays] = useState<number[]>([]);
    const [recurStart, setRecurStart] = useState("09:00");
    const [recurEnd, setRecurEnd] = useState("17:00");
    const [recurStartDate, setRecurStartDate] = useState<Date | undefined>(undefined);
    const [recurEndDate, setRecurEndDate] = useState<Date | undefined>(undefined);

    const daysMap = [
        { id: 0, label: "Lun" },
        { id: 1, label: "Mar" },
        { id: 2, label: "Mié" },
        { id: 3, label: "Jue" },
        { id: 4, label: "Vie" },
        { id: 5, label: "Sáb" },
        { id: 6, label: "Dom" },
    ];

    const fetchChannels = async () => {
        try {
            if (!token) return;
            setLoading(true);
            const data = await apiRequest<Channel[]>('/owner/channels');
            setChannels(data);
            if (data.length > 0) {
                if (!selectedChannelId) {
                    setSelectedChannelId(data[0].id.toString());
                }
            }
        } catch (e) {
            console.error("Error fetching channels", e);
            toast.error("Error al cargar canales");
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            if (!token || !selectedChannelId) return;
            setLoading(true);
            const data = await apiRequest<Dictionary>(`/calls/config?channel_id=${selectedChannelId}`);
            setConfig(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && token) {
            fetchChannels();
        } else if (!token && !authLoading) {
            setLoading(false);
        }
    }, [token, authLoading]);

    useEffect(() => {
        if (selectedChannelId) {
            fetchConfig();
        }
    }, [selectedChannelId]);

    const handleSaveConfig = async () => {
        try {
            const data = await apiRequest('/calls/config', {
                method: "POST",
                body: JSON.stringify({
                    price: parseFloat(config.price.toString()),
                    duration_minutes: parseInt(config.duration_minutes.toString()),
                    description: config.description,
                    is_active: config.is_active,
                    channel_id: selectedChannelId ? parseInt(selectedChannelId) : null
                }),
            });

            if (data) {
                toast.success("Configuración guardada");
                fetchConfig();
            }
        } catch (e) {
            toast.error("Error al guardar: " + (e as Error).message);
        }
    };

    const handleAddSlot = async () => {
        if (!newSlotDate || !newSlotTime) return;

        const dateStr = format(newSlotDate, "yyyy-MM-dd");
        const start_time = new Date(`${dateStr}T${newSlotTime}:00`).toISOString();

        try {
            const data = await apiRequest('/calls/slots', {
                method: "POST",
                body: JSON.stringify([{ start_time }]),
            });

            if (data) {
                toast.success("Horario agregado");
                setNewSlotDate(undefined);
                setNewSlotTime("");
                fetchConfig();
            }
        } catch (e) {
            toast.error("Error agregando horario");
        }
    };

    const handleDeleteSlot = async (id: number) => {
        try {
            await apiRequest(`/calls/slots/${id}`, {
                method: "DELETE"
            });
            toast.success("Horario eliminado");
            fetchConfig();
        } catch (e) {
            toast.error("Error eliminando slot");
        }
    };

    const handleGenerateSlots = async () => {
        if (!recurStartDate || !recurEndDate || recurringDays.length === 0) {
            toast.error("Completa los campos de recurrencia");
            return;
        }

        try {
            const res = await apiRequest('/calls/availability/generate', {
                method: 'POST',
                body: JSON.stringify({
                    days_of_week: recurringDays,
                    start_time: recurStart,
                    end_time: recurEnd,
                    start_date: recurStartDate?.toISOString(),
                    end_date: recurEndDate?.toISOString(),
                    channel_id: selectedChannelId ? parseInt(selectedChannelId) : null
                })
            });

            if (res) {
                toast.success("Horarios generados correctamente");
                fetchConfig();
            }
        } catch (e) {
            toast.error("Error generando horarios (Verifica solapamientos o datos)");
        }
    };

    const toggleDay = (dayId: number) => {
        if (recurringDays.includes(dayId)) {
            setRecurringDays(recurringDays.filter(d => d !== dayId));
        } else {
            setRecurringDays([...recurringDays, dayId]);
        }
    };

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

                <div className="w-48">
                    <Label className="text-xs mb-1 block text-gray-400">Canal Seleccionado</Label>
                    <select
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
                        value={selectedChannelId}
                        onChange={(e) => setSelectedChannelId(e.target.value)}
                    >
                        {loading && channels.length === 0 && <option value="">Cargando canales...</option>}
                        {!loading && channels.length === 0 && <option value="">No se encontraron canales</option>}
                        {channels.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
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
                        <DatePicker
                            date={newSlotDate}
                            setDate={setNewSlotDate}
                            className="flex-1"
                            placeholder="Fecha de la sesión"
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

                    <div className="border-t border-gray-800 pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-3 text-purple-400">Generador de Recurrencia</h4>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {daysMap.map(day => (
                                    <button
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`px-3 py-1 rounded text-xs border ${recurringDays.includes(day.id) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Input type="time" value={recurStart} onChange={e => setRecurStart(e.target.value)} className="w-24 text-xs" />
                                <span className="text-gray-500">-</span>
                                <Input type="time" value={recurEnd} onChange={e => setRecurEnd(e.target.value)} className="w-24 text-xs" />
                            </div>
                            <div className="flex gap-2">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Desde</Label>
                                    <DatePicker
                                        date={recurStartDate}
                                        setDate={setRecurStartDate}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Hasta</Label>
                                    <DatePicker
                                        date={recurEndDate}
                                        setDate={setRecurEndDate}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleGenerateSlots} className="w-full bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-xs">
                                ✨ Generar Bloques
                            </Button>
                        </div>
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
