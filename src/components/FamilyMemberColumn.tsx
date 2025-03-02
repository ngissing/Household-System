import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { motion } from "framer-motion";

interface Chore {
  id: string;
  title: string;
  routineId?: string;
  routineTitle?: string;
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
    <div className="flex flex-col items-center space-y-6 min-w-[240px] max-w-[240px] snap-start">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalChores} Completed
        </p>
      </div>

      <div className="w-full space-y-6">
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
                  onClick={() => onChoreComplete(chore.id)}
                  className="group w-full text-left bg-white rounded-lg p-4 shadow-sm border border-border/50 hover:border-primary/20 transition-colors flex items-center gap-4"
                >
                  <div
                    className={`relative w-6 h-6 rounded-full border-2 transition-colors ${chore.completed ? "border-primary bg-primary/10" : "border-muted-foreground/30 group-hover:border-primary/50"} flex items-center justify-center`}
                  >
                    {chore.completed ? (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-4 h-4 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    ) : (
                      <div className="w-full h-full rounded-full group-hover:bg-primary/5 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={
                        chore.completed
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {chore.title}
                    </p>
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
