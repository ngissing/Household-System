import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog"; // Import Dialog components
import { Button } from "./ui/button";
import AddChoreDialog from "./AddChoreDialog";
import CalendarWidget from "./CalendarWidget";
import FamilyMemberColumn from "./FamilyMemberColumn";
import { initGoogleCalendar } from "../lib/google-calendar";
import { supabase } from "@/lib/supabase";
// import { calculateLevelInfo } from "@/lib/levels"; // Removed import
// Import NewChoreData along with other types
import type { Chore, FamilyMember, Routine, NewChoreData } from "@/lib/types";
// Import date-fns functions at the top level
import { addDays, addWeeks, addMonths, isSameDay, isBefore, isAfter, startOfDay as startOfDayFns, addYears, format } from 'date-fns'; // Add format


// Remove the local Routine interface definition below
// interface Routine {
//   id: string;
//   title: string;
//   description?: string;
//   assignedTo: string;
//   chores: {
//     title: string;
//     points: number;
//   }[];
// }

export default function ChoreManager() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  // const [showCalendar, setShowCalendar] = useState(false); // Remove this
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false); // New state for dialog
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date()); // New state for dialog's calendar
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
        .select("*, color") // Select the color column
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  const updateCalendarEvents = async () => {
    try {
      // Fetch only non-recurring chores or base recurring chores for calendar count
      const { data, error } = await supabase
        .from("chores")
        .select("due_date, is_recurring, original_chore_id")
        .or('is_recurring.eq.false,original_chore_id.is.null'); // Count non-recurring or base recurring

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
    setLoading(true); // Ensure loading state is set
    const targetDate = startOfDayFns(date || selectedDate); // Ensure we compare start of day
    const startOfDayIso = targetDate.toISOString();
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayIso = endOfDay.toISOString();


    try {
      // 1. Fetch ALL chore records (base, non-recurring, completed instances) potentially relevant
      const { data: allChoresData, error: initialFetchError } = await supabase
        .from("chores")
        .select("*, routines ( color ), icon") // Added icon
        // Fetch base templates OR any instance within the date range
        .or(`original_chore_id.is.null,and(due_date.gte.${startOfDayIso},due_date.lte.${endOfDayIso})`);


      if (initialFetchError) throw initialFetchError;
      const allFetchedChores = allChoresData || [];

      // Separate base templates from actual instances for the target date
      const recurringBases = allFetchedChores.filter(c => c.is_recurring && c.original_chore_id === null);
      const instancesForDate = allFetchedChores.filter(c => !c.is_recurring && isSameDay(new Date(c.due_date), targetDate));

      // Find completed instances specifically for the check below
      const completedInstancesForDate = instancesForDate.filter(c => c.status === 'completed' && c.original_chore_id !== null);


      // 2. (Renumbered) Fetch potential BASE recurring chores that could apply today (templates) - Already done above
      const { data: recurringBasesData, error: recurringError } = await supabase
        .from("chores")
        .select("*, routines ( color ), icon") // Also join routines here if needed, Added icon
        .eq("is_recurring", true)
        .is("original_chore_id", null) // Fetch base records where original_chore_id is NULL
        .lte("due_date", endOfDayIso) // Started on or before target date
        .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${startOfDayIso}`); // Not ended yet

      // (No separate fetch needed)

      // 3. (Renumbered) Generate *pending* instances for recurring chores IF a completed one doesn't already exist
      const generatedRecurringInstances: Chore[] = [];
      recurringBases.forEach((baseChore) => {
        // Basic validation
        if (!baseChore.recurrence_unit || baseChore.recurrence_frequency == null || !baseChore.due_date) {
            console.warn("Skipping recurring chore due to missing data:", baseChore.id);
            return;
        }

        let currentDate = startOfDayFns(new Date(baseChore.due_date));
        const recurrenceEndDate = baseChore.recurrence_end_date ? startOfDayFns(new Date(baseChore.recurrence_end_date)) : null;

        // Loop forward from the base chore's start date
        while (isBefore(currentDate, endOfDay) || isSameDay(currentDate, targetDate)) {
          // Stop if we've passed the recurrence end date
          if (recurrenceEndDate && isAfter(currentDate, recurrenceEndDate)) {
            break;
          }

          // If the calculated date matches the target date, check if we need to generate a pending instance
          if (isSameDay(currentDate, targetDate)) {
            // Check if a COMPLETED instance exists in our filtered list
            const completedInstanceExists = completedInstancesForDate.some(c =>
                c.original_chore_id === baseChore.id
                // Status='completed' and !is_recurring already filtered
            );

            // Only generate a PENDING instance if no COMPLETED one exists for this day
            if (!completedInstanceExists) {
               generatedRecurringInstances.push({
                 ...baseChore,
                 // Use consistent yyyy-MM-dd format for the temporary ID date part
                 id: `${baseChore.id}-${format(targetDate, 'yyyy-MM-dd')}`,
                 due_date: targetDate.toISOString(), // Keep ISO string for initial display/state if needed
                 status: 'pending',
                 original_chore_id: baseChore.id, // Link back to base
                 is_recurring: false, // Mark as a generated instance, not the template
                 icon: baseChore.icon, // Carry over icon
               });
            }
            break; // Found potential instance for this date, move to next base chore
          }

          // Increment currentDate based on recurrence, handle potential invalid frequency
          const frequency = baseChore.recurrence_frequency;
          if (frequency <= 0) {
              console.warn("Invalid recurrence frequency for chore:", baseChore.id);
              break; // Prevent infinite loop
          }

          try {
              switch (baseChore.recurrence_unit) {
                case 'day':
                  currentDate = addDays(currentDate, frequency);
                  break;
                case 'week':
                  currentDate = addWeeks(currentDate, frequency);
                  break;
                case 'month':
                  currentDate = addMonths(currentDate, frequency);
                  break;
                default:
                  console.warn("Invalid recurrence unit for chore:", baseChore.id);
                  return; // Exit forEach for this baseChore
              }
          } catch (dateError) {
              console.error("Error calculating next recurrence date:", dateError);
              break; // Stop processing this chore if date calculation fails
          }

          // Safety break for potential infinite loops (e.g., invalid data)
          if (isAfter(currentDate, addYears(targetDate, 5))) { // Limit lookahead to 5 years
              console.warn("Recurring chore lookahead limit reached, potential issue:", baseChore.id);
              break;
          }
        }
      });

      // --- Routine Chore Generation Logic ---
      // Combine the actual instances for the date (non-recurring + completed recurring)
      // with the newly generated PENDING recurring instances.
      const combinedChoresBase = [...instancesForDate, ...generatedRecurringInstances];
      let finalChores = combinedChoresBase; // Start with combined list

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (targetDate >= now) { // Only generate routine chores for today or future
        const { data: routines, error: routinesError } = await supabase
          .from("routines")
          .select("*, color, routine_chores(*)")
          .contains("active_days", [targetDate.getDay()]);

        if (routinesError) throw routinesError;

        // Use combinedChoresBase for checking existing routine keys
        const existingRoutineKeys = new Set(
          combinedChoresBase
            ?.filter((c) => c.routine_id)
            .map((c) => `${c.routine_id}-${c.title}`),
        );

        const choresToCreateFromRoutines = [];
        routines?.forEach((routine) => {
          if (!routine.routine_chores) return;
          routine.routine_chores.forEach((chore: any) => {
            if (!existingRoutineKeys.has(`${routine.id}-${chore.title}`)) {
              choresToCreateFromRoutines.push({
                title: chore.title,
                description: routine.description,
                assigned_to: routine.assigned_to,
                points: chore.points,
                status: "pending",
                routine_id: routine.id,
                routine_title: routine.title,
                due_date: targetDate.toISOString(),
                is_recurring: false, // Routine chores are not recurring themselves
                is_default: false, // Assuming routine chores aren't default
                icon: null, // Routines don't have icons defined per chore yet
                // Add other necessary fields expected by the 'chores' table if any
              });
            }
          });
        });

        if (choresToCreateFromRoutines.length > 0) {
          const { data: insertedRoutineChores, error: insertError } = await supabase
            .from("chores")
            .insert(choresToCreateFromRoutines)
            .select("*, routines ( color ), icon"); // Select joined color, Added icon

          if (insertError) throw insertError;
          if (insertedRoutineChores) {
            // Combine existing, generated recurring, and newly created routine chores
            finalChores = [...combinedChoresBase, ...insertedRoutineChores];
          }
          // No early return here, set final state after try block
        }
      }
      // --- End Routine Chore Generation Logic ---

      setChores(finalChores); // Set the final combined list

    } catch (error) {
      console.error("Error fetching chores:", error);
      setChores([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Update function signature to accept NewChoreData
  const handleAddChore = async (data: NewChoreData) => {
    try {
      const choresToInsert = data.assignedMemberIds.map((memberId) => {
        const baseChoreData = {
          title: data.title,
          description: data.description || null,
          assigned_to: memberId,
          points: data.points,
          status: "pending",
          is_default: false,
          due_date: data.dueDate?.toISOString(),
          // Add recurrence fields if applicable
          is_recurring: data.isRecurring,
          recurrence_unit: data.isRecurring ? data.recurrence?.unit : null,
          recurrence_frequency: data.isRecurring ? data.recurrence?.frequency : null,
          recurrence_end_date: data.isRecurring ? data.recurrence?.endDate?.toISOString() : null,
          original_chore_id: null, // Base recurring chores have null original_id initially
          icon: data.icon || null, // Add icon here
        };
        return baseChoreData;
      });


      if (choresToInsert.length === 0) return;

      // Insert the initial instances
      const { data: insertedData, error } = await supabase
        .from("chores")
        .insert(choresToInsert)
        .select("*, icon"); // Select the inserted rows to get their IDs, Added icon

      if (error) throw error;

      // Update local state immediately
      if (insertedData) {
        // Set the original_chore_id for the newly inserted recurring chores
        const updates = insertedData
          .filter(chore => chore.is_recurring) // Only update recurring ones
          .map(chore => ({
            id: chore.id,
            original_chore_id: chore.id // Link it to itself
          }));

        if (updates.length > 0) {
          const { error: updateError } = await supabase
            .from("chores")
            .upsert(updates); // Use upsert to update the original_chore_id

          if (updateError) {
            console.error("Error setting original_chore_id:", updateError);
            // Decide if we should proceed or throw error
          }
        }

        // Update local state with the initially inserted chores
        // Note: The original_chore_id might not be reflected immediately here
        // unless we re-fetch or manually add it. For now, just add insertedData.
        setChores((prevChores) => [...insertedData, ...prevChores]);
        updateCalendarEvents(); // Refresh calendar dots
      }
    } catch (error) {
      console.error("Error adding chore:", error);
    }
  };

  // CORRECTED handleCompleteChore function
  const handleCompleteChore = async (id: string) => {
    // Find the chore object in the current state
    const choreIndex = chores.findIndex((c) => c.id === id);
    if (choreIndex === -1) {
        console.error("Chore not found in local state:", id);
        return;
    }
    const clickedChore = chores[choreIndex];
    const originalStatus = clickedChore.status; // Store original status for potential revert
    const newStatus = originalStatus === "completed" ? "pending" : "completed";

    // Determine if this is a generated recurring instance based on ID format
    const idParts = id.split('-');
    // A simple check: UUIDs have 5 parts separated by 4 hyphens. Our temp ID adds '-YYYY-MM-DD'.
    const isGeneratedInstance = idParts.length > 5 && !isNaN(Date.parse(idParts.slice(5).join('-')));
    const originalChoreId = isGeneratedInstance ? idParts.slice(0, 5).join('-') : id;
    const instanceDateStr = isGeneratedInstance ? idParts.slice(5).join('-') : null;

    // Optimistically update local state first
    setChores((prevChores) =>
        prevChores.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );

    try {
        let pointsError: any = null;
        let choreForPointsCalc: Chore | null = null; // Chore used for point calculation

        if (isGeneratedInstance && instanceDateStr) {
            // --- Handle Generated Recurring Instance ---
            console.log("Completing generated instance for:", originalChoreId, instanceDateStr);

            // 1. Fetch base chore details (needed for points, assignment etc.)
            const { data: baseChoreData, error: fetchError } = await supabase
                .from("chores")
                .select("*, icon") // Added icon
                .eq("id", originalChoreId)
                .maybeSingle(); // Use maybeSingle to handle potential null

            if (fetchError || !baseChoreData) {
                throw fetchError || new Error(`Base recurring chore not found: ${originalChoreId}`);
            }

            // 2. Insert new row for this specific instance
            // Ensure the due_date reflects the start of the LOCAL day derived from instanceDateStr
            // Parse YYYY-MM-DD as local date, get start of that day, then convert to ISO string for DB
            const localDateForInstance = new Date(instanceDateStr + 'T00:00:00'); // Treat YYYY-MM-DD as local time midnight
            const dueDateForDb = startOfDayFns(localDateForInstance).toISOString();

            const choreToInsert = {
                title: baseChoreData.title,
                description: baseChoreData.description,
                assigned_to: baseChoreData.assigned_to,
                points: baseChoreData.points,
                status: newStatus, // Use the toggled status
                due_date: dueDateForDb, // Use the correctly adjusted date for DB
                is_recurring: false, // This is a specific instance
                is_default: baseChoreData.is_default,
                original_chore_id: originalChoreId, // Link back to base
                routine_id: baseChoreData.routine_id, // Copy routine info if applicable
                routine_title: baseChoreData.routine_title,
                icon: baseChoreData.icon, // Add icon here
            };

            const { data: insertedInstanceData, error: insertError } = await supabase
                .from("chores")
                .insert(choreToInsert)
                .select("*, routines ( color ), icon") // Select needed data, including joined routine color, Added icon
                .single();

           // --- BEGIN ADDED LOGGING ---
           if (insertError) {
               console.error("[ChoreManager] Error inserting recurring instance:", insertError);
               throw insertError;
           } else if (!insertedInstanceData) {
               throw new Error("Failed to insert chore instance (no data returned).");
           } else {
               console.log("[ChoreManager] Successfully inserted recurring instance:", insertedInstanceData.id);
           }
           // --- END ADDED LOGGING ---

           choreForPointsCalc = insertedInstanceData; // Use newly inserted chore for points calc

            // Update local state: replace temporary with real one
            setChores((prevChores) => {
                const newChores = prevChores.filter(c => c.id !== id); // Remove temporary
                newChores.push(insertedInstanceData); // Add real one
                return newChores;
            });

        } else {
            // --- Handle Regular Chore Instance OR Uncompleting a Recurring Instance ---
            choreForPointsCalc = clickedChore; // Use the clicked chore for points calc

            if (newStatus === 'pending' && clickedChore.original_chore_id) {
                // --- Deleting a completed recurring instance (uncompleting) ---
                console.log("Uncompleting recurring instance - Deleting record:", id);
                const { error: deleteError } = await supabase
                    .from("chores")
                    .delete()
                    .eq("id", id);

                if (deleteError) {
                    console.error("[ChoreManager] Error deleting recurring instance:", deleteError);
                    throw deleteError;
                } else {
                    console.log("[ChoreManager] Successfully deleted recurring instance:", id);
                    // Remove from local state immediately after successful delete
                    setChores((prevChores) => prevChores.filter(c => c.id !== id));
                }

            } else {
                // --- Updating a regular chore instance (complete or uncomplete) ---
                console.log("Updating regular instance status:", id, "to", newStatus);
                const { error: updateError } = await supabase
                    .from("chores")
                    .update({ status: newStatus })
                    .eq("id", id); // Use the standard UUID

                if (updateError) {
                     console.error("[ChoreManager] Error updating regular chore status:", updateError);
                     throw updateError;
                } else {
                     console.log("[ChoreManager] Successfully updated regular chore status:", id);
                }
            }
        }

        // --- Update Points (Common Logic - runs for both complete and uncomplete) ---
        if (choreForPointsCalc) {
            // First get current points
            const { data: memberData, error: memberError } = await supabase
                .from("family_members")
                .select("points")
                .eq("id", choreForPointsCalc.assigned_to)
                .single();

            if (memberError) throw memberError;

            // Then update with new points
            const pointChange = newStatus === "completed" ? choreForPointsCalc.points : -choreForPointsCalc.points;
            const calculatedNewPoints = (memberData?.points || 0) + pointChange;
            // Remove level/progress calculation
            // const { level: calculatedLevel, progress: calculatedProgress } = calculateLevelInfo(calculatedNewPoints);
            const newPoints = Math.round(calculatedNewPoints);
            // const level = Math.round(calculatedLevel);
            // const progress = Math.round(calculatedProgress);

            ({ error: pointsError } = await supabase
                .from("family_members")
                .update({ points: newPoints }) // Only update points
                .eq("id", choreForPointsCalc.assigned_to));

            if (pointsError) throw pointsError;

            // Update local familyMembers state
            setFamilyMembers(prevMembers =>
                prevMembers.map(member =>
                    member.id === choreForPointsCalc?.assigned_to
                        ? { ...member, points: newPoints } // Only update points
                        : member
                )
            );
        }

    } catch (error) {
        console.error("Error toggling chore:", error);
        // Revert optimistic UI update on error
        setChores((prevChores) =>
            prevChores.map((c) => (c.id === id ? { ...c, status: originalStatus } : c)),
        );
        alert("Failed to update chore status. Please try again.");
    }
  };

  const handleOpenCalendarDialog = () => {
    setTempSelectedDate(selectedDate); // Initialize dialog calendar with current selected date
    setIsCalendarDialogOpen(true);
  };

  const handleConfirmDateSelection = () => {
    setSelectedDate(tempSelectedDate);
    // fetchChores will be called by the useEffect listening to selectedDate
    setIsCalendarDialogOpen(false);
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
        {/* Display formatted selected date */}
        <h2 className="text-2xl font-bold text-primary">
          {format(selectedDate, "EEEE, MMMM d")}
        </h2>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleOpenCalendarDialog} // Updated onClick
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            {/* Remove AddRoutineDialog component usage */}
            {/* <AddRoutineDialog ... /> */}
            <AddChoreDialog
              onAddChore={handleAddChore}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      </div>

      {/* Allow wrapping and adjust gap/padding for better fitting */}
      <div className="flex flex-wrap gap-6 pb-6 justify-center">
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
              memberColor={member.color || undefined} // Pass member color down
              chores={memberChores.map((chore) => ({
                id: chore.id,
                title: chore.title,
                routineId: chore.routine_id,
                routineTitle: chore.routine_title,
                completed: chore.status === "completed",
                points: chore.points, // Pass points down
                // Pass routine_color down (access nested routine data)
                routineColor: chore.routines?.color || undefined,
                icon: chore.icon, // Pass the icon property
              }))}
              completedCount={completedCount}
              totalChores={memberChores.length}
              totalPoints={member.points} // Pass total points
              onChoreComplete={handleCompleteChore}
            />
          );
        })}
      </div>

      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <CalendarWidget
              selectedDate={tempSelectedDate} // Use tempSelectedDate for the dialog's calendar
              onSelect={(date) => {
                setTempSelectedDate(date || new Date()); // Update tempSelectedDate only
              }}
              events={calendarEvents} // You might want to fetch events for the whole month or not show counts here
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDateSelection}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
