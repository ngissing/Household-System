import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";

interface Routine {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  active_days: number[];
  chores: Array<{
    id: string;
    title: string;
    points: number;
  }>;
}

interface RoutineManagerProps {
  familyMembers?: Array<{ id: string; name: string }>;
}

export default function RoutineManager({
  familyMembers = [],
}: RoutineManagerProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    fetchRoutines();
    return () => setRoutines([]);
  }, []);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      // Fetch routines
      const { data: routinesData, error: routinesError } = await supabase
        .from("routines")
        .select("*");

      if (routinesError) throw routinesError;

      // Fetch routine chores for each routine
      const routinesWithChores = await Promise.all(
        (routinesData || []).map(async (routine) => {
          const { data: choresData, error: choresError } = await supabase
            .from("routine_chores")
            .select("*")
            .eq("routine_id", routine.id);

          if (choresError) throw choresError;

          return {
            ...routine,
            active_days: routine.active_days || [],
            chores: choresData || [],
          };
        }),
      );

      setRoutines(routinesWithChores);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoutine) return;

    try {
      // Ensure active_days is an array
      const active_days = Array.isArray(editingRoutine.active_days)
        ? editingRoutine.active_days
        : [];

      if (editingRoutine.id) {
        // Update existing routine
        const { error: routineError } = await supabase
          .from("routines")
          .update({
            title: editingRoutine.title,
            description: editingRoutine.description,
            assigned_to: editingRoutine.assigned_to,
            active_days,
          })
          .eq("id", editingRoutine.id);

        if (routineError) throw routineError;

        // Delete existing chores
        await supabase
          .from("routine_chores")
          .delete()
          .eq("routine_id", editingRoutine.id);
      } else {
        // Create new routine
        const { data: newRoutine, error: routineError } = await supabase
          .from("routines")
          .insert({
            title: editingRoutine.title,
            description: editingRoutine.description,
            assigned_to: editingRoutine.assigned_to,
            active_days,
          })
          .select()
          .single();

        if (routineError || !newRoutine) throw routineError;
        editingRoutine.id = newRoutine.id;
      }

      // Insert chores
      if (editingRoutine.chores.length > 0) {
        const { error: choresError } = await supabase
          .from("routine_chores")
          .insert(
            editingRoutine.chores.map((chore) => ({
              routine_id: editingRoutine.id,
              title: chore.title,
              points: chore.points,
            })),
          );

        if (choresError) throw choresError;
      }

      await fetchRoutines();
      setIsDialogOpen(false);
      setEditingRoutine(null);
    } catch (error) {
      console.error("Error saving routine:", error);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
      await fetchRoutines();
    } catch (error) {
      console.error("Error deleting routine:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Routines</CardTitle>
          <Button
            onClick={() => {
              setEditingRoutine({
                id: "",
                title: "",
                description: "",
                assigned_to: "",
                active_days: [],
                chores: [{ id: "", title: "", points: 0 }],
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Routine
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routines.map((routine) => (
            <Card key={routine.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{routine.title}</h3>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground">
                        {routine.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Assigned to:{" "}
                      {
                        familyMembers.find((m) => m.id === routine.assigned_to)
                          ?.name
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active on:{" "}
                      {routine.active_days.map((day) => DAYS[day]).join(", ")}
                    </p>
                    <div className="mt-2 space-y-1">
                      {routine.chores.map((chore) => (
                        <div
                          key={chore.id}
                          className="text-sm flex items-center gap-2"
                        >
                          • {chore.title} ({chore.points} pts)
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingRoutine(routine);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRoutine(routine.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRoutine?.id ? "Edit" : "Create"} Routine
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRoutine} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Routine Name</Label>
                <Input
                  id="title"
                  value={editingRoutine?.title}
                  onChange={(e) =>
                    setEditingRoutine((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  placeholder="Morning Routine"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={editingRoutine?.assigned_to}
                  onValueChange={(value) =>
                    setEditingRoutine((prev) =>
                      prev ? { ...prev, assigned_to: value } : null,
                    )
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Active Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map((day, index) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${index}`}
                        checked={editingRoutine?.active_days.includes(index)}
                        onCheckedChange={(checked) =>
                          setEditingRoutine((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  active_days: checked
                                    ? [...prev.active_days, index]
                                    : prev.active_days.filter(
                                        (d) => d !== index,
                                      ),
                                }
                              : null,
                          )
                        }
                      />
                      <label
                        htmlFor={`day-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chores</Label>
                <div className="space-y-2">
                  {editingRoutine?.chores?.map((chore, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={chore.title}
                        onChange={(e) =>
                          setEditingRoutine((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  chores: prev.chores.map((c, i) =>
                                    i === index
                                      ? { ...c, title: e.target.value }
                                      : c,
                                  ),
                                }
                              : null,
                          )
                        }
                        placeholder="Chore title"
                      />
                      <Input
                        type="number"
                        value={chore.points}
                        onChange={(e) =>
                          setEditingRoutine((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  chores: prev.chores.map((c, i) =>
                                    i === index
                                      ? {
                                          ...c,
                                          points: parseInt(e.target.value) || 0,
                                        }
                                      : c,
                                  ),
                                }
                              : null,
                          )
                        }
                        placeholder="Points"
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingRoutine((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  chores: prev.chores.filter(
                                    (_, i) => i !== index,
                                  ),
                                }
                              : null,
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setEditingRoutine((prev) =>
                        prev
                          ? {
                              ...prev,
                              chores: [
                                ...prev.chores,
                                { id: "", title: "", points: 0 },
                              ],
                            }
                          : null,
                      )
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Chore
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Save Routine
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
