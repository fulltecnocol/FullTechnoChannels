"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl shadow-indigo-500/5", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-2 pb-4 relative items-center border-b border-slate-800/50",
                caption_label: "text-base font-bold text-slate-100",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-slate-900 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-800 border-slate-700 text-slate-300 transition-all"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "grid grid-cols-7 w-full justify-items-center mb-2",
                head_cell:
                    "text-indigo-400/70 rounded-md w-10 font-semibold text-[0.8rem] text-center uppercase tracking-wider",
                row: "grid grid-cols-7 w-full mt-2 justify-items-center",
                cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-indigo-500/10 [&:has([aria-selected])]:bg-indigo-500/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-slate-800 text-slate-300 transition-all rounded-full data-[selected]:shadow-lg data-[selected]:shadow-indigo-500/20"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:bg-indigo-600 focus:text-white font-bold",
                day_today: "bg-slate-800/50 text-indigo-400 border border-indigo-500/30",
                day_outside:
                    "day-outside text-slate-700 opacity-50 aria-selected:bg-indigo-500/10 aria-selected:text-slate-500 aria-selected:opacity-30",
                day_disabled: "text-slate-700 opacity-20",
                day_range_middle:
                    "aria-selected:bg-indigo-500/10 aria-selected:text-indigo-300",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => props.orientation === 'left' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
