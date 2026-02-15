"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/CustomCalendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    placeholder?: string;
}

export function DatePicker({ date, setDate, className, placeholder = "Seleccionar fecha" }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-neutral-900 border-amber-500/20">
                <CustomCalendar
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0"
                />
            </PopoverContent>
        </Popover>
    )
}
