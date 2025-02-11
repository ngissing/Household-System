import { Check, Clock, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ChoreCardProps {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  dueDate: string;
  status: "pending" | "completed";
  onComplete?: (id: string) => void;
}

export default function ChoreCard({
  id,
  title,
  description,
  assignedTo,
  points,
  dueDate,
  status,
  onComplete,
}: ChoreCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(dueDate).toLocaleDateString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Assigned to: {assignedTo}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
            <Star className="h-4 w-4" />
            <span>{points}</span>
          </div>
          {status === "pending" && onComplete && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onComplete(id)}
            >
              <Check className="h-4 w-4" />
              Complete
            </Button>
          )}
          {status === "completed" && (
            <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
              Completed
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
