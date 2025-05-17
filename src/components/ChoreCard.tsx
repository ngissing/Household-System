import { Check, Clock, Star, icons, LucideProps } from "lucide-react"; // Import icons and LucideProps
import confetti from "canvas-confetti";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter
import React from "react"; // Import React for dynamic component rendering

interface ChoreCardProps {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  dueDate: string;
  status: "pending" | "completed";
  onComplete?: (id: string) => void;
  icon?: string | null; // Add icon prop
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
  icon, // Destructure icon
}: ChoreCardProps) {

  const renderIcon = () => {
    if (!icon) return null;
    const LucideIcon = icons[icon as keyof typeof icons] as React.FC<LucideProps>;
    if (!LucideIcon) {
      console.warn(`Icon "${icon}" not found in lucide-react`);
      return null; // Or a default icon
    }
    return <LucideIcon className="h-6 w-6 mr-2 text-primary" />; // Added text-primary for color
  };

  // Confetti handler
  const handleComplete = () => {
    if (onComplete) {
      onComplete(id);
      // Trigger confetti!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 1000, // Ensure it's above other elements
      });
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow rounded-lg"> {/* Increased padding, shadow, rounding */}
      <div className="flex items-start justify-between gap-6"> {/* Increased gap */}
        <div className="flex-1">
          <div className="flex items-center"> {/* Wrapper for title and icon */}
            {renderIcon()}
            <h3 className="font-semibold text-xl">{title}</h3> {/* Increased font size */}
          </div>
          {description && (
            <p className="text-base text-muted-foreground mt-2">{description}{/* Increased font size and margin */}</p>
          )}
          <div className="flex items-center gap-4 mt-3"> {/* Increased margin */}
            <span className="text-base text-muted-foreground flex items-center gap-1.5"> {/* Increased font size and gap */}
              <Clock className="h-5 w-5" /> {/* Increased icon size */}
              {new Date(dueDate).toLocaleDateString()}
            </span>
            <span className="text-base text-muted-foreground"> {/* Increased font size */}
              Assigned to: {assignedTo}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3"> {/* Increased gap */}
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-base">
            <Star className="h-5 w-5" />
            <span>{formatPointsAsDollars(points)}</span>
          </div>
          {status === "pending" && onComplete && (
            <Button
              variant="outline"
              size="lg" // Increased button size
              className="gap-2 text-lg font-semibold border-2 border-primary hover:bg-primary/10" // Increased gap, font size, added border
              onClick={handleComplete} // Use new handler
            >
              <Check className="h-5 w-5" /> {/* Increased icon size */}
              Complete! 🎉
            </Button>
          )}
          {status === "completed" && (
            <span className="text-green-700 bg-green-100 px-4 py-1.5 rounded-full text-base font-medium"> {/* Increased padding, font size/weight */}
              Done! ✨
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
