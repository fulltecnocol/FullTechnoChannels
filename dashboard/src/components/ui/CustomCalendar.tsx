"use client";

import React, { useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomCalendarProps {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    className?: string;
    highlightedDates?: Date[]; // Dates that have slots
}

export function CustomCalendar({
    selected,
    onSelect,
    className,
    highlightedDates = []
}: CustomCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // 1. Calculate the days to display
    // Start week on Monday (1)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDayClick = (day: Date) => {
        if (onSelect) {
            onSelect(day);
        }
    };

    return (
        <div className={cn("p-4 bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/5", className)}>

            {/* HEADER: Month navigation */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-base font-bold text-amber-50 capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-8 w-8 text-amber-500/70 hover:text-amber-400 hover:bg-neutral-800"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 text-amber-500/70 hover:text-amber-400 hover:bg-neutral-800"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* BODY: Days Grid */}
            <div className="w-full">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="h-8 flex items-center justify-center text-[0.8rem] font-semibold text-amber-500/60 uppercase tracking-wider"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-y-2">
                    {calendarDays.map((day, dayIdx) => {
                        const isSelected = selected ? isSameDay(day, selected) : false;
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);
                        const hasSlot = highlightingCheck(day, highlightedDates);

                        // Validation: Disable past days
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Start of day
                        const isPast = day < today;

                        // Base Text Color
                        let textColor = "text-neutral-300";
                        if (!isCurrentMonth) textColor = "text-neutral-600";
                        if (isPast) textColor = "text-neutral-700 opacity-30 cursor-not-allowed"; // Disabled style
                        else if (isSelected) textColor = "text-black font-bold";
                        else if (isDayToday) textColor = "text-amber-400";

                        return (
                            <div key={day.toString()} className="flex justify-center relative">
                                <button
                                    onClick={() => !isPast && handleDayClick(day)}
                                    disabled={isPast}
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all relative z-10",
                                        textColor,
                                        !isPast && !isSelected && "hover:bg-amber-500/10 hover:text-amber-200",
                                        isSelected && "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20 scale-105",
                                        isDayToday && !isSelected && "bg-neutral-800/50 border border-amber-500/30"
                                    )}
                                >
                                    <time dateTime={format(day, 'yyyy-MM-dd')}>
                                        {format(day, "d")}
                                    </time>
                                </button>

                                {/* Visual Indicator for Slots (The Gold Dot) */}
                                {hasSlot && !isSelected && !isPast && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] z-20 pointer-events-none" />
                                )}
                                {hasSlot && isSelected && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/50 rounded-full z-20 pointer-events-none" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Helper to check efficiently if a day matches any highlighted date
function highlightingCheck(day: Date, dates: Date[]) {
    // Simple O(N) check is fine for typical number of slots (e.g. < 100 displayed)
    // For larger datasets, we'd use a Set<string> of "yyyy-MM-dd"
    return dates.some(d => isSameDay(d, day));
}
