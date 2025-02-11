import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface CalendarWidgetProps {
  selectedDate?: Date;
  onSelect?: (date: Date | undefined) => void;
  events?: Array<{
    date: Date;
    count: number;
  }>;
}

export default function CalendarWidget({
  selectedDate,
  onSelect,
  events = [],
}: CalendarWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          className="rounded-md border"
          modifiers={{
            event: (date) =>
              events.some(
                (event) => event.date.toDateString() === date.toDateString(),
              ),
          }}
          modifiersStyles={{
            event: {
              fontWeight: "bold",
              backgroundColor: "hsl(var(--primary))",
              color: "white",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
