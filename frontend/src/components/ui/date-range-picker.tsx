// File: src/components/ui/date-range-picker.tsx
import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
  placeholder = "Pick a date range",
  disabled = false,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedRange: DateRange | undefined) => {
    onDateChange?.(selectedRange)
    // Close popover if both dates are selected
    if (selectedRange?.from && selectedRange?.to) {
      setOpen(false)
    }
  }

  const formatDateRange = (dateRange?: DateRange) => {
    if (!dateRange) return placeholder
    
    if (dateRange.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
      } else {
        return format(dateRange.from, "LLL dd, y")
      }
    }
    
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Export preset date ranges for common use cases
export const dateRangePresets = {
  today: {
    from: new Date(),
    to: new Date(),
  },
  yesterday: {
    from: addDays(new Date(), -1),
    to: addDays(new Date(), -1),
  },
  last7Days: {
    from: addDays(new Date(), -7),
    to: new Date(),
  },
  last30Days: {
    from: addDays(new Date(), -30),
    to: new Date(),
  },
  thisMonth: {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  },
  lastMonth: {
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
  },
}

// Advanced DatePickerWithRange with presets
export function DatePickerWithRangePresets({
  className,
  date,
  onDateChange,
  placeholder = "Pick a date range",
  disabled = false,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedRange: DateRange | undefined) => {
    onDateChange?.(selectedRange)
    if (selectedRange?.from && selectedRange?.to) {
      setOpen(false)
    }
  }

  const handlePresetSelect = (preset: DateRange) => {
    onDateChange?.(preset)
    setOpen(false)
  }

  const formatDateRange = (dateRange?: DateRange) => {
    if (!dateRange) return placeholder
    
    if (dateRange.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
      } else {
        return format(dateRange.from, "LLL dd, y")
      }
    }
    
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r">
              <div className="p-3">
                <h4 className="text-sm font-medium mb-2">Quick Select</h4>
                <div className="space-y-1">
                  {Object.entries(dateRangePresets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}