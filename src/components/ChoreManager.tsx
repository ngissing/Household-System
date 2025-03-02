import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import AddRoutineDialog from "./AddRoutineDialog";
import { Button } from "./ui/button";
import AddChoreDialog from "./AddChoreDialog";
import CalendarWidget from "./CalendarWidget";
import FamilyMemberColumn from "./FamilyMemberColumn";
import { initGoogleCalendar } from "../lib/google-calendar";
import { supabase } from "@/lib/supabase";
import { calculateLevelInfo } from "@/lib/levels";
import type { Chore, FamilyMember } from "@/lib/types";

interface Routine {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  chores: {
    title: string;
    points: number;
  }[];
}

export default function ChoreManager() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<
    { date: Date; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Google Calendar
    initGoogleCalendar().catch(console.error);

    fetchFamilyMembers();
    fetchChores(selectedDate);
    updateCalendarEvents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("chores_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chores" },
        () => {
          fetchChores(selectedDate);
          updateCalendarEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  const updateCalendarEvents = async () => {
    try {
      const { data, error } = await supabase.from("chores").select("due_date");

      if (error) throw error;

      // Group chores by date
      const eventCounts = (data || []).reduce(
        (acc, chore) => {
          const date = new Date(chore.due_date);
          const dateStr = date.toDateString();
          acc[dateStr] = (acc[dateStr] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Convert to calendar events format
      const events = Object.entries(eventCounts).map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }));

      setCalendarEvents(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  };

  const fetchChores = async (date?: Date) => {
    const targetDate = date || selectedDate;
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all chores for the selected date
      const { data: dateChores, error: dateError } = await supabase
        .from("chores")
        .select("*")
        .gte("due_date", startOfDay.toISOString())
        .lte("due_date", endOfDay.toISOString());

      if (dateError) throw dateError;

      // Only create routine chores for today or future dates
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (targetDate >= now) {
        // Get all routines that are active for this day of the week
        const { data: routines, error: routinesError } = await supabase
          .from("routines")
          .select("*, routine_chores(*)")
          .contains("active_days", [targetDate.getDay()]);

        if (routinesError) throw routinesError;

        // Filter out routine chores that already exist for this date
        const existingRoutineKeys = new Set(
          dateChores
            ?.filter((c) => c.routine_id)
            .map((c) => `${c.routine_id}-${c.title}`),
        );

        const choresToCreate = [];
        routines?.forEach((routine) => {
          if (!routine.routine_chores) return;
          routine.routine_chores.forEach((chore: any) => {
            if (!existingRoutineKeys.has(`${routine.id}-${chore.title}`)) {
              choresToCreate.push({
                title: chore.title,
                description: routine.description,
                assigned_to: routine.assigned_to,
                points: chore.points,
                status: "pending",
                routine_id: routine.id,
                routine_title: routine.title,
                due_date: targetDate.toISOString(),
              });
            }
          });
        });

        if (choresToCreate.length > 0) {
          const { data: insertedChores, error: insertError } = await supabase
            .from("chores")
            .insert(choresToCreate)
            .select();

          if (insertError) throw insertError;
          if (insertedChores) {
            setChores([...(dateChores || []), ...insertedChores]);
          } else {
            setChores(dateChores || []);
          }
          return;
        }
      }

      setChores(dateChores || []);
    } catch (error) {
      console.error("Error fetching chores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChore = async (newChore: {
    title: string;
    description: string;
    assignedTo: string;
    points: number;
    isDefault: boolean;
    routineId?: string;
    routineTitle?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("chores")
        .insert({
          title: newChore.title,
          description: newChore.description,
          assigned_to: newChore.assignedTo,
          points: newChore.points,
          routine_id: newChore.routineId,
          routine_title: newChore.routineTitle,
          status: "pending",
          is_default: newChore.isDefault,
          due_date: selectedDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately
      if (data) {
        setChores((prevChores) => [data, ...prevChores]);
        updateCalendarEvents();
      }
    } catch (error) {
      console.error("Error adding chore:", error);
    }
  };

  const handleCompleteChore = async (id: string) => {
    try {
      const chore = chores.find((c) => c.id === id);
      if (!chore) return;

      const newStatus = chore.status === "completed" ? "pending" : "completed";

      // Update local state immediately
      setChores((prevChores) =>
        prevChores.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );

      const { error } = await supabase
        .from("chores")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Update family member points
      if (chore) {
        // First get current points
        const { data: memberData, error: memberError } = await supabase
          .from("family_members")
          .select("points")
          .eq("id", chore.assigned_to)
          .single();

        if (memberError) throw memberError;

        // Then update with new points - add points if completing, subtract if uncompleting
        const pointChange =
          newStatus === "completed" ? chore.points : -chore.points;
        const newPoints = (memberData?.points || 0) + pointChange;
        const { level, progress } = calculateLevelInfo(newPoints);

        const { error: pointsError } = await supabase
          .from("family_members")
          .update({
            points: newPoints,
            level,
            progress,
          })
          .eq("id", chore.assigned_to);

        if (pointsError) throw pointsError;
      }
    } catch (error) {
      console.error("Error toggling chore:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                routine.chores.forEach((chore) => {
                  handleAddChore({
                    title: chore.title,
                    description: routine.description || "",
                    assignedTo: routine.assignedTo,
                    points: chore.points,
                    routine_template: false,
                    routineId: routineId,
                    routineTitle: routine.title,
                  });
                });
              }}
              familyMembers={familyMembers}
            />
            <AddChoreDialog
              onAddChore={handleAddChore}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 snap-x">
        {familyMembers.map((member) => {
          const memberChores = chores.filter(
            (chore) => chore.assigned_to === member.id,
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
                routineId: chore.routine_id,
                routineTitle: chore.routine_title,
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
            onSelect={(date) => {
              setSelectedDate(date || new Date());
              fetchChores(date || new Date());
            }}
            events={calendarEvents}
          />
        </div>
      )}
    </div>
  );
}
