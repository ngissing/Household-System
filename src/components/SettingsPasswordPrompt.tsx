import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface SettingsPasswordPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<boolean>; // Returns true if password is correct
}

export default function SettingsPasswordPrompt({
  open,
  onOpenChange,
  onSubmit,
}: SettingsPasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Please enter the password.");
      return;
    }

    setIsChecking(true);
    try {
      const isCorrect = await onSubmit(password);
      if (!isCorrect) {
        setError("Incorrect password.");
      } else {
        // Parent component will handle closing on success
        setPassword(""); // Clear password on success/failure
      }
    } catch (err) {
      console.error("Error checking password:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsChecking(false);
      // Don't clear password here if incorrect, allow retry
      if (error !== "Incorrect password.") {
          setPassword("");
      }
    }
  };

  // Reset state when dialog closes/opens
  const handleOpenChangeInternal = (isOpen: boolean) => {
    if (!isOpen) {
        setPassword("");
        setError(null);
        setIsChecking(false);
    }
    onOpenChange(isOpen); // Notify parent
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Settings Locked
          </DialogTitle>
          <DialogDescription>
            Please enter the password to access settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isChecking}>
              {isChecking ? "Checking..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}