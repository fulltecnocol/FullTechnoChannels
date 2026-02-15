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
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    const handleDeleteSlot = async (id: number, skipFetch = false) => {
        try {
            await apiRequest(`/calls/slots/${id}`, {
                method: "DELETE"
            });
            if (!skipFetch) {
                toast.success("Horario eliminado");
                fetchConfig();
            }
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
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Video className="w-6 h-6 text-amber-500" />
                        Venta de Llamadas Privadas
                    </h2>
                    <p className="text-neutral-400">Configura tus sesiones 1 a 1 con suscriptores.</p>
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

                    <Button onClick={handleSaveConfig} className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20">
                        Guardar Cambios
                    </Button>
                </Card>

                {/* SCHEDULER CARD (Option B) */}
                <Card className="p-6 bg-gray-900 border-gray-800 md:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                                <CalendarIcon className="w-5 h-5 text-amber-500" />
                                Gestión de Disponibilidad
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-neutral-400">Zona Horaria Detectada:</p>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total Disponibles</p>
                                <p className="text-xl font-mono text-amber-400">{config.slots?.filter((s: any) => !s.is_booked).length || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Calendar & Stats */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-sm">
                                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-sm">
                                    <CustomCalendar
                                        selected={newSlotDate}
                                        onSelect={setNewSlotDate}
                                        className="w-full pointer-events-auto"
                                        highlightedDates={config.slots?.map((s: any) => new Date(s.start_time)) || []}
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-lg">
                                <h4 className="text-xs font-bold text-indigo-300 uppercase mb-3">Generador de Recurrencia</h4>
                                <div className="space-y-4 text-xs">
                                    <div className="flex flex-wrap gap-2">
                                        {daysMap.map(day => (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleDay(day.id)}
                                                className={`px-3 py-1.5 rounded-md border transition-all ${recurringDays.includes(day.id) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] text-gray-500 uppercase">Hora Inicio</Label>
                                            <Input type="time" value={recurStart} onChange={e => setRecurStart(e.target.value)} className="h-8 bg-gray-900 border-gray-800 text-xs" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] text-gray-500 uppercase">Hora Fin</Label>
                                            <Input type="time" value={recurEnd} onChange={e => setRecurEnd(e.target.value)} className="h-8 bg-gray-900 border-gray-800 text-xs" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] text-gray-500 uppercase">Desde</Label>
                                            <DatePicker date={recurStartDate} setDate={setRecurStartDate} className="h-8 text-[10px]" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] text-gray-500 uppercase">Hasta</Label>
                                            <DatePicker date={recurEndDate} setDate={setRecurEndDate} className="h-8 text-[10px]" />
                                        </div>
                                    </div>
                                    <Button onClick={handleGenerateSlots} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-9 shadow-lg shadow-indigo-600/20">
                                        ✨ Generar Bloques en Rango
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Selected Day Slots */}
                        <div className="lg:col-span-7 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                                <h4 className="font-medium text-gray-200">
                                    {newSlotDate ? format(newSlotDate, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
                                </h4>
                                {newSlotDate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-red-500 hover:text-red-400 hover:bg-red-900/10"
                                        onClick={async () => {
                                            const slotsToDelete = config.slots?.filter((s: any) =>
                                                !s.is_booked &&
                                                format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd')
                                            );
                                            if (slotsToDelete?.length > 0 && confirm(`¿Eliminar los ${slotsToDelete.length} bloques de este día?`)) {
                                                setLoading(true); // Single loading state for the whole process
                                                try {
                                                    for (const s of slotsToDelete) {
                                                        await handleDeleteSlot(s.id, true);
                                                    }
                                                    toast.success(`${slotsToDelete.length} bloques eliminados`);
                                                } finally {
                                                    fetchConfig();
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> Limpiar Día
                                    </Button>
                                )}
                            </div>

                            {newSlotDate ? (
                                <div className="flex-1 flex flex-col">
                                    {/* Quick Add */}
                                    <div className="flex gap-2 mb-6">
                                        <div className="relative flex-1">
                                            <Input
                                                type="time"
                                                value={newSlotTime}
                                                onChange={(e) => setNewSlotTime(e.target.value)}
                                                className="bg-gray-900 border-gray-800 pr-10"
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <Button onClick={handleAddSlot} className="bg-purple-600 hover:bg-purple-500">
                                            Añadir Hora
                                        </Button>
                                    </div>

                                    {/* Slots List */}
                                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                                        {config.slots?.filter((s: any) =>
                                            !s.is_booked &&
                                            format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd')
                                        ).sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-600 bg-gray-950/20 rounded-xl border border-dashed border-gray-800">
                                                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                                                <p className="text-sm italic">Sin horarios disponibles para este día.</p>
                                            </div>
                                        ) : (
                                            config.slots?.filter((s: any) =>
                                                !s.is_booked &&
                                                format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd')
                                            ).sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map((slot: any) => (
                                                <div key={slot.id} className="group flex justify-between items-center p-3 bg-gray-800/60 hover:bg-gray-800 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 rounded text-indigo-400">
                                                            <Video className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <span className="text-lg font-mono text-white">
                                                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{config.duration_minutes} MINUTOS</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-950/20 rounded-xl border border-dashed border-gray-800">
                                    <CalendarIcon className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-center px-8">Selecciona una fecha en el calendario para ver o añadir horarios.</p>
                                </div>
                            )}
                        </div>
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
