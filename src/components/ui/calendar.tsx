import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 max-w-4xl mx-auto", 
        month: "space-y-4", 
        caption: "flex justify-center pt-1 relative items-center text-2xl font-bold", 
        caption_label: "text-2xl font-bold text-mint-700", 
        nav: "space-x-2 flex items-center text-2xl", 
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-12 w-12 bg-transparent p-0 opacity-70 hover:opacity-100 text-2xl"
        ),
        nav_button_previous: "absolute left-2", 
        nav_button_next: "absolute right-2", 
        table: "w-full border-separate border-spacing-0 text-xl", 
        head_row: "grid grid-cols-7 text-lg w-full", 
        head_cell:
          "text-muted-foreground rounded-md font-bold text-lg h-12 flex items-center justify-center border-b border-mint-100 bg-mint-50", 
        row: "grid grid-cols-7 w-full mt-4", 
        cell: "h-24 w-24 text-center text-xl p-0 relative align-top flex items-stretch justify-stretch [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20", 
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-24 w-24 p-0 font-bold aria-selected:opacity-100 text-2xl"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
