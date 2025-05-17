import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import type { FamilyMember } from "@/lib/types";

interface AddPointsDialogProps {
  members: FamilyMember[];
  onAddPoints: (memberId: string, pointsToAdd: number) => Promise<void>;
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export default function AddPointsDialog({
  members,
  onAddPoints,
  triggerButton,
}: AddPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [amountDollars, setAmountDollars] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and a single decimal point
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setAmountDollars(value);
      setError(null); // Clear error on valid input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    const amount = parseFloat(amountDollars);
    if (!selectedMemberId) {
      setError("Please select a family member.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid positive dollar amount.");
      return;
    }

    // Convert dollars to points (cents)
    const pointsToAdd = Math.round(amount * 100);

    setIsSaving(true);
    try {
      await onAddPoints(selectedMemberId, pointsToAdd);
      setOpen(false); // Close dialog on success
      // Reset form
      setSelectedMemberId("");
      setAmountDollars("");
    } catch (err) {
      console.error("Error adding points:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setSelectedMemberId("");
        setAmountDollars("");
        setError(null);
        setIsSaving(false);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || <Button variant="outline">Add Points</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Points/Money</DialogTitle>
          <DialogDescription>
            Manually add points (as dollars) to a family member's balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Family Member</Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              required
            >
              <SelectTrigger id="member">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.length > 0 ? (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="-" disabled>No members found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Dollars)</Label>
            <div className="relative">
               <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                 id="amount"
                 type="text" // Use text to better control input format
                 inputMode="decimal" // Hint for mobile keyboards
                 placeholder="e.g., 5.00"
                 value={amountDollars}
                 onChange={handleAmountChange}
                 className="pl-8" // Padding left for the dollar sign
                 required
               />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Adding..." : "Add Points"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}