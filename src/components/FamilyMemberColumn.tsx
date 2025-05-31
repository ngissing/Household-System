import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
// Add Circle back to imports
import { CheckCircle2, Circle, Star, icons as LucideIcons, LucideProps } from "lucide-react"; // Import icons and LucideProps
import { Progress } from "./ui/progress";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter
import React from "react"; // Import React

interface Chore {
  id: string;
  title: string;
  routineId?: string;
  routineTitle?: string;
  completed: boolean;
  points: number; // Add points here
  routineColor?: string; // Add routineColor here
  icon?: string | null; // Add icon here
}

interface FamilyMemberColumnProps {
  name: string;
  avatar: string;
  chores: Chore[];
  completedCount: number;
  totalChores: number;
  totalPoints: number; // Add totalPoints prop
  onChoreComplete: (choreId: string) => void;
  memberColor?: string; // Add memberColor prop
}

export default function FamilyMemberColumn({
  name,
  avatar,
  chores,
  completedCount,
  totalChores,
  onChoreComplete,
  memberColor, // Destructure memberColor
  totalPoints, // Destructure totalPoints
}: FamilyMemberColumnProps) {
 // Confetti handler
  const handleCompleteClick = (choreId: string) => {
    onChoreComplete(choreId);
    // Trigger confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000, // Ensure it's above other elements
    });
  };

  // Helper to convert hex to rgba for background tint
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const columnBgColor = memberColor ? hexToRgba(memberColor, 0.1) : 'transparent'; // Light tint

  return (
    // Apply background tint and rounded corners to the column
    // Use flex properties for width to fit 5 columns (adjust basis % and gap compensation as needed)
    <div
      className="flex flex-col items-center space-y-4 p-4 rounded-lg flex-grow flex-shrink-0 basis-[calc(20%-1.5rem)]" // Use flex basis for ~1/5 width minus gap-6
      style={{ backgroundColor: columnBgColor }}
    >
      <div className="flex flex-col items-center space-y-2 w-full">
        <Avatar className="h-12 w-12">
           {/* Reverted timestamp addition */}
           <AvatarImage src={avatar} key={avatar} />
           <AvatarFallback>{name[0]}</AvatarFallback>
         </Avatar>
         <h3 className="text-lg font-semibold">{name}</h3>
        {/* Container for Check/Count and Points */}
        <div className="flex items-center justify-center gap-2 w-full mt-1">
           {/* Checkmark and Count */}
           <div className="flex items-center gap-1 text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
               <CheckCircle2 className="h-4 w-4 text-green-600" />
               <span>{completedCount}/{totalChores}</span>
           </div>
           {/* Points Badge */}
           <div className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
               <Star className="h-4 w-4" />
               <span>{formatPointsAsDollars(totalPoints)}</span>
           </div>
        </div>
        {/* Add Progress Bar */}
        <Progress
           value={totalChores > 0 ? (completedCount / totalChores) * 100 : 0}
           className="h-2 w-full bg-white" // White background for contrast
           // Set CSS variable on the Progress component itself
           style={{ '--progress-indicator-color': memberColor || 'hsl(var(--primary))' } as React.CSSProperties}
           // Use the CSS variable in the indicator class
           indicatorClassName="bg-[--progress-indicator-color]"
         />
      </div>

      <div className="w-full space-y-2"> {/* Reduced space between chores */}
        {/* Group chores by routine */}
        {Object.entries(
          chores.reduce(
            (acc, chore) => {
              const key = chore.routineId || "individual";
              if (!acc[key]) acc[key] = [];
              acc[key].push(chore);
              return acc;
            },
            {} as Record<string, typeof chores>,
          ),
        ).map(([routineId, routineChores]) => (
          <div key={routineId} className="space-y-2">
            {routineId !== "individual" && routineChores[0].routineTitle && (
              <h4 className="text-sm font-medium text-muted-foreground pl-2">
                {routineChores[0].routineTitle}
              </h4>
            )}
            <div className="space-y-2">
              {routineChores.map((chore) => (
                <button
                  key={chore.id}
                  onClick={() => handleCompleteClick(chore.id)}
                  className={`group w-full text-left rounded-xl p-4 transition-colors flex items-center gap-3 ${ // Increased padding slightly
                    chore.completed
                      ? 'text-white' // White text for completed
                      : 'bg-white border border-gray-200 hover:bg-gray-50' // White bg, border for pending
                  }`}
                  style={{
                    backgroundColor: chore.completed ? memberColor || 'hsl(var(--primary))' : undefined, // Member color bg if completed
                    borderColor: !chore.completed ? memberColor || 'hsl(var(--border))' : undefined, // Member color border if pending
                    color: chore.completed ? '#ffffff' : undefined // Ensure text color contrasts
                  }}
                >
                  {/* Chore Title & Points */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center"> {/* Wrapper for icon and title */}
                      {chore.icon && (() => {
                        const IconComponent = LucideIcons[chore.icon as keyof typeof LucideIcons] as React.FC<LucideProps>;
                        if (IconComponent) {
                          return <IconComponent className={`h-4 w-4 mr-2 ${chore.completed ? 'text-white/90' : 'text-primary'}`} />;
                        }
                        return null;
                      })()}
                      <p
                        className={`font-medium ${
                          chore.completed ? 'opacity-90' : '' // Slightly dim completed text
                        }`}
                      >
                        {chore.title}
                      </p>
                    </div>
                    {/* Display Points */}
                    <div className={`flex items-center gap-1 text-xs mt-0.5 ${chore.completed ? 'text-white/70' : 'text-muted-foreground'}`}>
                       <Star className="h-3 w-3" />
                       <span>{formatPointsAsDollars(chore.points)}</span>
                    </div>
                  </div>

                  {/* Completion Icon (Right Side) */}
                  <div className="flex-shrink-0">
                    {chore.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-white/90" /> // White check for completed
                    ) : (
                      <Circle
                        className="h-6 w-6 text-gray-300 group-hover:text-[--member-color]" // Use CSS var for hover
                        style={{ '--member-color': memberColor } as React.CSSProperties}
                      /> // Circle for pending, hover color
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
