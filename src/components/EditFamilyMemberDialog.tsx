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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Pencil } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  progress: number;
  streak: number;
}

interface EditFamilyMemberDialogProps {
  member?: FamilyMember;
  onSave: (
    member: Omit<FamilyMember, "points" | "level" | "progress" | "streak">,
  ) => void;
}

export default function EditFamilyMemberDialog({
  member,
  onSave,
}: EditFamilyMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member?.name || "");
  const [avatarSeed, setAvatarSeed] = useState(
    member?.name || Math.random().toString(36),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      id: member?.id || crypto.randomUUID(),
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
    });

    setOpen(false);
    if (!member) {
      setName("");
      setAvatarSeed(Math.random().toString(36));
    }
  };

  const regenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {member ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>Add Family Member</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                onClick={regenerateAvatar}
              >
                Regenerate Avatar
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {member ? "Save Changes" : "Add Member"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
