import { motion } from "framer-motion";
import { CheckCircle2, Circle, Star, icons as LucideIcons, LucideProps } from "lucide-react";
import { formatPointsAsDollars } from "@/lib/utils";
import React from "react";

interface Chore {
  id: string;
  title: string;
  routineId?: string;
  routineTitle?: string;
  completed: boolean;
  points: number;
  routineColor?: string;
  icon?: string | null;
}

interface ChoreCardProps {
  chore: Chore;
  memberColor?: string;
  onCompleteChore: (choreId: string) => void;
  onDeleteChore: (choreId: string) => void;
}

const ChoreCard: React.FC<ChoreCardProps> = ({ chore, memberColor, onCompleteChore, onDeleteChore }) => {
  const handleDelete = () => {
    onDeleteChore(chore.id);
  };

  return (
    <motion.div
      layout
      initial={{ scale: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.x < -100) {
          handleDelete();
        }
      }}
      className="relative"
    >
      <button
        onClick={() => onCompleteChore(chore.id)}
        className={`group w-full text-left rounded-xl p-4 transition-colors flex items-center gap-3 ${
          chore.completed
            ? 'text-white'
            : 'bg-white border border-gray-200 hover:bg-gray-50'
        }`}
        style={{
          backgroundColor: chore.completed ? memberColor || 'hsl(var(--primary))' : undefined,
          borderColor: !chore.completed ? memberColor || 'hsl(var(--border))' : undefined,
          color: chore.completed ? '#ffffff' : undefined
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {chore.icon && (() => {
              const IconComponent = LucideIcons[chore.icon as keyof typeof LucideIcons] as React.FC<LucideProps>;
              if (IconComponent) {
                return <IconComponent className={`h-4 w-4 mr-2 ${chore.completed ? 'text-white/90' : 'text-primary'}`} />;
              }
              return null;
            })()}
            <p className={`font-medium ${chore.completed ? 'opacity-90' : ''}`}>
              {chore.title}
            </p>
          </div>
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${chore.completed ? 'text-white/70' : 'text-muted-foreground'}`}>
            <Star className="h-3 w-3" />
            <span>{formatPointsAsDollars(chore.points)}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {chore.completed ? (
            <CheckCircle2 className="h-6 w-6 text-white/90" />
          ) : (
            <Circle
              className="h-6 w-6 text-gray-300 group-hover:text-[--member-color]"
              style={{ '--member-color': memberColor } as React.CSSProperties}
            />
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default ChoreCard;
