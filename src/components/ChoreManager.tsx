import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ListTodo } from "lucide-react";
import AddRoutineDialog from "./AddRoutineDialog";
import { Button } from "./ui/button";
import AddChoreDialog from "./AddChoreDialog";
import CalendarWidget from "./CalendarWidget";
import FamilyMemberColumn from "./FamilyMemberColumn";
import { addChoreToCalendar, getCalendarEvents } from "../lib/google-calendar";

interface Routine {
  id: string;
  title: string;
  description?: string;
  chores: {
    title: string;
    points: number;
  }[];
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  dueDate: string;
  status: "pending" | "completed";
}

const FAMILY_MEMBERS = [
  {
    id: "1",
    name: "Dad",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dad",
  },
  {
    id: "2",
    name: "Lacey",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lacey",
  },
  {
    id: "3",
    name: "Mikey",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mikey",
  },
  {
    id: "4",
    name: "Mom",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mom",
  },
];

export default function ChoreManager() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    if (selectedDate) {
      const timeMin = new Date(selectedDate);
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date(selectedDate);
      timeMax.setHours(23, 59, 59, 999);

      getCalendarEvents(timeMin, timeMax)
        .then(setCalendarEvents)
        .catch(console.error);
    }
  }, [selectedDate]);

  const handleAddChore = async (newChore: {
    title: string;
    description: string;
    assignedTo: string;
    points: number;
    dueDate: Date;
  }) => {
    const chore: Chore = {
      id: crypto.randomUUID(),
      ...newChore,
      dueDate: newChore.dueDate.toISOString(),
      status: "pending",
    };

    setChores((prev) => [...prev, chore]);

    try {
      await addChoreToCalendar({
        title: `${chore.title} (${FAMILY_MEMBERS.find((m) => m.id === chore.assignedTo)?.name})`,
        description: chore.description,
        dueDate: new Date(chore.dueDate),
      });
    } catch (error) {
      console.error("Failed to add chore to calendar:", error);
    }
  };

  const handleCompleteChore = (id: string) => {
    setChores((prev) =>
      prev.map((chore) =>
        chore.id === id ? { ...chore, status: "completed" } : chore,
      ),
    );
  };

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Chore Manager</h2>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <AddRoutineDialog
              onAddRoutine={(routine) => {
                const routineId = crypto.randomUUID();
                setRoutines([...routines, { ...routine, id: routineId }]);

                // Add all chores from the routine
                const now = new Date();
                routine.chores.forEach((chore) => {
                  handleAddChore({
                    title: chore.title,
                    description: routine.description,
                    assignedTo: routine.assignedTo,
                    points: chore.points,
                    dueDate: now,
                  });
                });
              }}
              familyMembers={FAMILY_MEMBERS}
            />
            <AddChoreDialog
              onAddChore={handleAddChore}
              familyMembers={FAMILY_MEMBERS}
              routines={routines}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6">
        {FAMILY_MEMBERS.map((member) => {
          const memberChores = chores.filter(
            (chore) => chore.assignedTo === member.id,
          );
          const completedCount = memberChores.filter(
            (chore) => chore.status === "completed",
          ).length;

          return (
            <FamilyMemberColumn
              key={member.id}
              name={member.name}
              avatar={member.avatar}
              chores={memberChores.map((chore) => ({
                id: chore.id,
                title: chore.title,
                dueDate: chore.dueDate,
                completed: chore.status === "completed",
              }))}
              completedCount={completedCount}
              totalChores={memberChores.length}
              onChoreComplete={handleCompleteChore}
            />
          );
        })}
      </div>

      {showCalendar && (
        <div className="mt-6">
          <CalendarWidget
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            events={calendarEvents.map((event) => ({
              date: new Date(event.start.dateTime || event.start.date),
              count: 1,
            }))}
          />
        </div>
      )}
    </div>
  );
}
