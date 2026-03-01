import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
    const [time, setTime] = React.useState<string>(date ? format(date, "HH:mm") : "12:00");

    React.useEffect(() => {
        if (date !== selectedDate) {
            setSelectedDate(date);
            if (date) {
                setTime(format(date, "HH:mm"));
            }
        }
    }, [date]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) {
            setSelectedDate(undefined);
            setDate(undefined);
            return;
        }

        const [hours, minutes] = time.split(":").map(Number);
        newDate.setHours(hours, minutes, 0, 0);
        setSelectedDate(newDate);
        setDate(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTime(newTime);
        if (selectedDate) {
            const [hours, minutes] = newTime.split(":").map(Number);
            const updatedDate = new Date(selectedDate);
            updatedDate.setHours(hours, minutes, 0, 0);
            setSelectedDate(updatedDate);
            setDate(updatedDate);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP p") : <span>Pick a date and time</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="p-3 border-t">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Time:</span>
                        <Input
                            type="time"
                            value={time}
                            onChange={handleTimeChange}
                            className="flex-1"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
