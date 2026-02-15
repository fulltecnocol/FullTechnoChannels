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
import { Loader2, Plus, Trash2, Video, Calendar as CalendarIcon, Clock } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailabilityManager } from "./AvailabilityManager";

interface CallSlot {
    id: number;
    start_time: string;
    is_booked: boolean;
    jitsi_link?: string;
    booked_by_name?: string;
    service_id: number;
    calendar_links?: {
        google: string;
        outlook: string;
        yahoo: string;
    };
}

interface CallService {
    id: number;
    channel_id?: number;
    description: string; // Used as Name
    duration_minutes: number;
    price: number;
    is_active: boolean;
    slots: CallSlot[];
}

interface Channel {
    id: number;
    title: string;
}

export default function CallsManagement() {
    const { user, token, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    // Services State
    const [services, setServices] = useState<CallService[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [isCreatingService, setIsCreatingService] = useState(false);

    // Form for Create/Edit Service
    const [serviceForm, setServiceForm] = useState({
        description: "",
        duration_minutes: 30,
        price: 0,
        is_active: true
    });

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");

    // Dynamic Slots & Manual Override State
    const [newSlotDate, setNewSlotDate] = useState<Date | undefined>(undefined);
    const [previewSlots, setPreviewSlots] = useState<any[]>([]);


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

    const fetchServices = async () => {
        try {
            if (!token || !selectedChannelId) return;
            setLoading(true);
            const data = await apiRequest<CallService[]>(`/calls/services?channel_id=${selectedChannelId}`);
            setServices(data);

            // Auto select first service if none selected or invalid
            if (data.length > 0 && (!selectedServiceId || !data.find(s => s.id === selectedServiceId))) {
                setSelectedServiceId(data[0].id);
            }
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
            fetchServices();
        }
    }, [selectedChannelId]);

    const handleCreateService = async () => {
        try {
            if (!serviceForm.description || serviceForm.duration_minutes <= 0 || serviceForm.price < 0) {
                toast.error("Completa los datos del servicio correctamente");
                return;
            }

            const newService = await apiRequest<CallService>('/calls/services', {
                method: "POST",
                body: JSON.stringify({
                    channel_id: parseInt(selectedChannelId),
                    ...serviceForm
                }),
            });

            toast.success("Servicio creado");
            setIsCreatingService(false);
            setServiceForm({ description: "", duration_minutes: 30, price: 0, is_active: true });

            // Direct state update for immediate reaction
            setServices(prev => [...prev, newService]);
            setSelectedServiceId(newService.id);

            // Background sync (optional but safe)
            // fetchServices(); 
        } catch (e) {
            toast.error("Error: " + (e as Error).message);
        }
    };

    const handleDeleteService = async (id: number) => {
        if (!confirm("¿Eliminar este servicio y todos sus horarios?")) return;
        try {
            await apiRequest(`/calls/services/${id}`, { method: "DELETE" });
            toast.success("Servicio eliminado");

            // Direct state update
            setServices(prev => prev.filter(s => s.id !== id));
            if (selectedServiceId === id) {
                setSelectedServiceId(null);
            }
        } catch (e) {
            toast.error("Error eliminando servicio");
        }
    };

    // Find selected service object
    const selectedService = services.find(s => s.id === selectedServiceId);

    const fetchDynamicSlots = async (serviceId: number, date: Date) => {
        try {
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);

            const startStr = format(start, "yyyy-MM-dd");
            const endStr = format(end, "yyyy-MM-dd");

            const slots = await apiRequest<any[]>(`/availability/slots?service_id=${serviceId}&from_date=${startStr}&to_date=${endStr}`);
            setPreviewSlots(slots);
        } catch (e) {
            console.error(e);
        }
    };

    const handleBlockSlot = async (startTime: string, endTime: string) => {
        if (!selectedServiceId) return;
        if (!confirm("¿Seguro que quieres bloquear este horario? Los usuarios no podrán agendar a esta hora.")) return;

        try {
            await apiRequest('/availability/block', {
                method: "POST",
                body: JSON.stringify({
                    service_id: selectedServiceId,
                    start_time: startTime,
                    end_time: endTime
                })
            });
            toast.success("Horario bloqueado");
            // Refresh preview
            if (newSlotDate) {
                fetchDynamicSlots(selectedServiceId, newSlotDate);
            }
        } catch (e) {
            toast.error("Error al bloquear horario");
        }
    };

    useEffect(() => {
        if (selectedServiceId) {
            fetchDynamicSlots(selectedServiceId, newSlotDate || new Date());
        }
    }, [selectedServiceId, newSlotDate]); // Refetch when date changes (month view) or service changes

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
                {/* SERVICES LIST */}
                <Card className="p-6 space-y-4 bg-gray-900 border-gray-800">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">🛍 Mis Servicios</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingService(!isCreatingService)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-amber-500"
                        >
                            {isCreatingService ? "Cancelar" : "+ Nuevo"}
                        </Button>
                    </div>

                    {isCreatingService && (
                        <div className="bg-neutral-950 p-4 rounded-lg space-y-3 border border-neutral-800">
                            <div className="space-y-1">
                                <Label className="text-xs">Nombre del Servicio</Label>
                                <Input
                                    className="bg-neutral-900 border-neutral-800"
                                    placeholder="Ej: Asesoría 1h"
                                    value={serviceForm.description}
                                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Precio (USD)</Label>
                                    <Input
                                        type="number"
                                        className="bg-neutral-900 border-neutral-800"
                                        value={serviceForm.price}
                                        onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value || "0") })}
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Minutos</Label>
                                    <Input
                                        type="number"
                                        className="bg-neutral-900 border-neutral-800"
                                        value={serviceForm.duration_minutes}
                                        onChange={e => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value || "30") })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreateService} size="sm" className="w-full bg-primary text-primary-foreground font-bold shadow-lg shadow-amber-500/20">
                                Crear Servicio
                            </Button>
                        </div>
                    )}

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {services.length === 0 && !isCreatingService && (
                            <p className="text-sm text-neutral-500 italic text-center py-4">No tienes servicios activos.</p>
                        )}
                        {services.map(svc => (
                            <div
                                key={svc.id}
                                className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${selectedServiceId === svc.id ? 'bg-amber-900/20 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}
                                onClick={() => setSelectedServiceId(svc.id)}
                            >
                                <div>
                                    <p className="font-bold text-sm text-white">{svc.description}</p>
                                    <div className="flex gap-2 text-xs text-neutral-400">
                                        <span>⏱ {svc.duration_minutes}m</span>
                                        <span>💲 {svc.price}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {selectedServiceId === svc.id && <span className="text-amber-500 text-xs font-bold mr-2">ACTIVO</span>}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteService(svc.id);
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                <p className="text-sm text-neutral-400">
                                    {selectedService ? `Gestionando: ${selectedService.description} (${selectedService.duration_minutes}m)` : 'Selecciona un servicio arriba'}
                                </p>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total Disponibles</p>
                                <p className="text-xl font-mono text-amber-400">{selectedService?.slots.filter(s => !s.is_booked).length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {!selectedService ? (
                        <div className="p-8 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                            Selecciona o crea un servicio para gestionar su disponibilidad.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* LEFT: Availability Manager */}
                            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                                <AvailabilityManager />
                            </div>

                            {/* RIGHT: Calendar & Preview */}
                            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-sm">
                                    <h4 className="text-sm font-semibold text-gray-400 mb-4 px-2">Vista Previa de Disponibilidad</h4>
                                    <CustomCalendar
                                        selected={newSlotDate}
                                        onSelect={setNewSlotDate}
                                        className="w-full pointer-events-auto"
                                        highlightedDates={previewSlots.map(s => new Date(s.start_time))}
                                    />
                                </div>

                                {/* Slot Preview List */}
                                <div className="bg-neutral-950/30 p-4 rounded-xl border border-neutral-800">
                                    <h4 className="font-medium text-gray-200 mb-3 mx-2 text-sm flex justify-between items-center">
                                        <span>
                                            {newSlotDate ? format(newSlotDate, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
                                        </span>
                                        <span className="text-xs text-neutral-500 font-normal">
                                            {previewSlots.filter(s => newSlotDate && format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd')).length} espacios
                                        </span>
                                    </h4>

                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                                        {newSlotDate && previewSlots.filter(s =>
                                            format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd')
                                        ).length > 0 ? (
                                            previewSlots
                                                .filter(s => format(new Date(s.start_time), 'yyyy-MM-dd') === format(newSlotDate, 'yyyy-MM-dd'))
                                                .map((slot, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-900/60 rounded-lg border border-gray-800/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/10 rounded text-indigo-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-mono text-white">
                                                                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-green-500/80 bg-green-500/10 px-2 py-0.5 rounded">
                                                                Disponible
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                                                onClick={() => handleBlockSlot(slot.start_time, slot.end_time)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="text-center py-8 text-neutral-500 text-sm">
                                                {newSlotDate ? "No hay disponibilidad calculada." : "Selecciona una fecha del calendario."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>


                {/* BOOKINGS HISTORY */}
                <Card className="p-6 bg-gray-900 border-gray-800">
                    <h3 className="font-semibold text-lg mb-4">✅ Próximas Sesiones (Vendidas)</h3>
                    <div className="space-y-2">
                        {services.flatMap(s => s.slots).filter(s => s.is_booked).length === 0 && (
                            <p className="text-gray-500">Aún no tienes ventas.</p>
                        )}
                        {services.flatMap(s => s.slots.map(slot => ({ ...slot, serviceName: s.description }))).filter(s => s.is_booked).map(slot => (
                            <div key={slot.id} className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-green-900/10 border border-green-800/30 rounded-xl">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-green-400">
                                            {format(new Date(slot.start_time), "d 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                        <span className="bg-green-600/20 text-green-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-green-600/30">VENDIDO</span>
                                    </div>
                                    <div className="text-sm text-gray-200">
                                        Servicio: <span className="font-semibold text-white">{slot.serviceName}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5" />
                                        Link: <a href={slot.jitsi_link} target="_blank" className="underline hover:text-white transition-colors">{slot.jitsi_link}</a>
                                    </p>
                                </div>

                                {slot.calendar_links && (
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={slot.calendar_links.google}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-neutral-950/50 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-2"
                                        >
                                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                                            Google
                                        </a>
                                        <a
                                            href={slot.calendar_links.outlook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-neutral-950/50 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-2"
                                        >
                                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                                            Outlook
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div >
        </div>
    );
}
