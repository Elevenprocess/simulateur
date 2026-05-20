import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/custom-button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    onChange?.(range)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy")} -{" "}
                  {format(date.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-50" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto bg-background")}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Enhanced preset date ranges with better UX
export const dateRangePresets = [
  {
    label: "Aujourd'hui",
    range: {
      from: new Date(),
      to: new Date(),
    },
  },
  {
    label: "Hier",
    range: {
      from: addDays(new Date(), -1),
      to: addDays(new Date(), -1),
    },
  },
  {
    label: "7 derniers jours",
    range: {
      from: addDays(new Date(), -6),
      to: new Date(),
    },
  },
  {
    label: "30 derniers jours",
    range: {
      from: addDays(new Date(), -29),
      to: new Date(),
    },
  },
  {
    label: "3 derniers mois",
    range: {
      from: addDays(new Date(), -89),
      to: new Date(),
    },
  },
  {
    label: "Cette année",
    range: {
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    },
  },
]