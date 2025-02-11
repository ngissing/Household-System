import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { motion } from "framer-motion";

interface Chore {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

interface FamilyMemberColumnProps {
  name: string;
  avatar: string;
  chores: Chore[];
  completedCount: number;
  totalChores: number;
  onChoreComplete: (choreId: string) => void;
}

export default function FamilyMemberColumn({
  name,
  avatar,
  chores,
  completedCount,
  totalChores,
  onChoreComplete,
}: FamilyMemberColumnProps) {
  return (
    <div className="flex flex-col items-center space-y-6 min-w-[250px]">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalChores} Completed
        </p>
      </div>

      <div className="w-full space-y-4">
        {chores.map((chore) => (
          <div
            key={chore.id}
            className="bg-white rounded-lg p-4 shadow-sm border flex items-center gap-4"
          >
            <button
              onClick={() => onChoreComplete(chore.id)}
              className="relative w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center"
            >
              {chore.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-primary"
                />
              )}
            </button>
            <div className="flex-1">
              <p
                className={
                  chore.completed ? "text-muted-foreground line-through" : ""
                }
              >
                {chore.title}
              </p>
              {chore.dueDate && (
                <p className="text-xs text-muted-foreground">
                  {new Date(chore.dueDate).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
