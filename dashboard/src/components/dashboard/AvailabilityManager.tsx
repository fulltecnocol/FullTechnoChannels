"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Clock } from "lucide-react";

interface AvailabilityRange {
    day_of_week: number; // 0=Mon
    start_time: string; // "09:00"
    end_time: string;   // "17:00"
    is_recurring: boolean;
}

const DAYS = [
    { id: 0, label: "Lunes" },
    { id: 1, label: "Martes" },
    { id: 2, label: "Miércoles" },
    { id: 3, label: "Jueves" },
    { id: 4, label: "Viernes" },
    { id: 5, label: "Sábado" },
    { id: 6, label: "Domingo" },
];

export function AvailabilityManager() {
    // Default: Mon-Fri 9-5
    const [ranges, setRanges] = useState<AvailabilityRange[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Temp state for editing
    // Map day_id -> { enabled, start, end }
    const [schedule, setSchedule] = useState<Record<number, { enabled: boolean; start: string; end: string }>>({});

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            setLoading(true);
            const data = await apiRequest<AvailabilityRange[]>("/api/availability/");

            // Transform to local state map
            const newSchedule: Record<number, { enabled: boolean; start: string; end: string }> = {};

            // Initialize all days as disabled default
            DAYS.forEach(d => {
                newSchedule[d.id] = { enabled: false, start: "09:00", end: "17:00" };
            });

            // Apply fetched ranges
            if (data && Array.isArray(data)) {
                data.forEach(r => {
                    if (r.is_recurring) {
                        newSchedule[r.day_of_week] = {
                            enabled: true,
                            start: r.start_time,
                            end: r.end_time
                        };
                    }
                });
            }

            setSchedule(newSchedule);
            setRanges(data || []);
        } catch (e) {
            console.error(e);
            toast.error("Error cargando disponibilidad");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Transform schedule map back to list
            const rangesToSave: AvailabilityRange[] = [];

            Object.entries(schedule).forEach(([dayIdStr, dayConfig]) => {
                const dayId = parseInt(dayIdStr);

                if (dayConfig.enabled) {
                    rangesToSave.push({
                        day_of_week: dayId,
                        start_time: dayConfig.start,
                        end_time: dayConfig.end,
                        is_recurring: true
                    });
                }
            });

            await apiRequest("/api/availability/", {
                method: "POST",
                body: JSON.stringify(rangesToSave)
            });

            toast.success("Disponibilidad guardada correctamente");
            fetchAvailability(); // Refresh to be safe
        } catch (e) {
            console.error(e);
            toast.error("Error guardando disponibilidad");
        } finally {
            setSaving(false);
        }
    };

    const updateDay = (dayId: number, field: string, value: string | boolean) => {
        setSchedule((prev) => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }));
    };

    if (loading) {
        return <div className="p-8 text-center text-neutral-500"><Loader2 className="animate-spin mx-auto mb-2" /> Cargando horario...</div>;
    }

    return (
        <Card className="p-6 bg-neutral-900 border-neutral-800 space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            Horario General
                        </h3>
                        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
                            Define tus horas de trabajo generales. El sistema calculará automáticamente los espacios disponibles.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {DAYS.map(day => {
                        const config = schedule[day.id];
                        if (!config) return null;

                        return (
                            <div key={day.id} className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={config.enabled}
                                        onCheckedChange={(c) => updateDay(day.id, 'enabled', c)}
                                    />
                                    <span className={`text-sm font-medium w-24 ${config.enabled ? 'text-white' : 'text-neutral-500'}`}>
                                        {day.label}
                                    </span>
                                </div>

                                {config.enabled ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={config.start}
                                            onChange={(e) => updateDay(day.id, 'start', e.target.value)}
                                            className="w-24 bg-neutral-900 border-neutral-700 h-8 text-sm focus:ring-indigo-500"
                                        />
                                        <span className="text-neutral-500">-</span>
                                        <Input
                                            type="time"
                                            value={config.end}
                                            onChange={(e) => updateDay(day.id, 'end', e.target.value)}
                                            className="w-24 bg-neutral-900 border-neutral-700 h-8 text-sm focus:ring-indigo-500"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-neutral-600 italic px-2">No disponible</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-w-[140px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
}
