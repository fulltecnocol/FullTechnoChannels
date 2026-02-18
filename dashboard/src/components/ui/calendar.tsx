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
            weekStartsOn={1}
            className={cn("p-4 bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/5", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-2 pb-4 relative items-center border-b border-amber-500/10",
                caption_label: "text-base font-bold text-amber-50",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-neutral-900 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-neutral-800 border-neutral-800 hover:border-amber-500/50 text-amber-100/70 hover:text-amber-400 transition-all"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1 block",
                head_row: "grid grid-cols-7 w-full mb-2",
                head_cell:
                    "text-amber-500/60 rounded-md w-10 font-semibold text-[0.8rem] text-center uppercase tracking-wider flex items-center justify-center",
                row: "grid grid-cols-7 w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-amber-500/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-amber-500/10 text-neutral-300 hover:text-amber-200 transition-all rounded-full mx-auto"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-gradient-to-br from-amber-500 to-yellow-600 text-black hover:from-amber-600 hover:to-yellow-700 focus:bg-amber-600 focus:text-black font-bold border border-amber-400/50 shadow-lg shadow-amber-500/20",
                day_today: "bg-neutral-800/50 text-amber-400 border border-amber-500/30",
                day_outside:
                    "day-outside text-neutral-600 opacity-50 aria-selected:bg-amber-500/10 aria-selected:text-neutral-500 aria-selected:opacity-30",
                day_disabled: "text-neutral-700 opacity-20",
                day_range_middle:
                    "aria-selected:bg-amber-500/10 aria-selected:text-amber-300",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => props.orientation === 'left' ? <ChevronLeft className="h-5 w-5 text-amber-500/70" /> : <ChevronRight className="h-5 w-5 text-amber-500/70" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
