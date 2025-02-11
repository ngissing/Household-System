import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AddRoutineDialogProps {
  onAddRoutine: (routine: {
    title: string;
    description: string;
    assignedTo: string;
    chores: { title: string; points: number }[];
  }) => void;
  familyMembers: Array<{ id: string; name: string }>;
}

export default function AddRoutineDialog({
  onAddRoutine,
  familyMembers,
}: AddRoutineDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [chores, setChores] = useState<{ title: string; points: number }[]>([]);
  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [newChorePoints, setNewChorePoints] = useState("");

  const handleAddChore = () => {
    if (!newChoreTitle || !newChorePoints) return;
    setChores([
      ...chores,
      { title: newChoreTitle, points: parseInt(newChorePoints) },
    ]);
    setNewChoreTitle("");
    setNewChorePoints("");
  };

  const handleRemoveChore = (index: number) => {
    setChores(chores.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || chores.length === 0) return;

    onAddRoutine({
      title,
      description,
      assignedTo,
      chores,
    });

    setOpen(false);
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setChores([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Routine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Routine Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bedtime Routine"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} required>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Evening tasks before bed"
            />
          </div>

          <div className="space-y-4">
            <Label>Chores in Routine</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Brush teeth"
                value={newChoreTitle}
                onChange={(e) => setNewChoreTitle(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Points"
                className="w-24"
                value={newChorePoints}
                onChange={(e) => setNewChorePoints(e.target.value)}
              />
              <Button type="button" onClick={handleAddChore}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {chores.map((chore, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-secondary p-2 rounded-md"
                >
                  <span className="flex-1">{chore.title}</span>
                  <span className="text-sm text-muted-foreground mr-2">
                    {chore.points} pts
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChore(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Routine
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
