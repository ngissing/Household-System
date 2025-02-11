import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import ChoreCard from "./ChoreCard";

interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  dueDate: string;
  status: "pending" | "completed";
}

interface ChoreListProps {
  chores: Chore[];
  onComplete?: (id: string) => void;
}

export default function ChoreList({ chores, onComplete }: ChoreListProps) {
  const [search, setSearch] = useState("");

  const filteredChores = chores.filter(
    (chore) =>
      chore.title.toLowerCase().includes(search.toLowerCase()) ||
      chore.description?.toLowerCase().includes(search.toLowerCase()) ||
      chore.assignedTo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chores..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredChores.map((chore) => (
          <ChoreCard key={chore.id} {...chore} onComplete={onComplete} />
        ))}
      </div>

      {filteredChores.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No chores found
        </div>
      )}
    </div>
  );
}
