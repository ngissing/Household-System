import { useState, useEffect } from "react"; // Add useEffect
import React from "react"; // Import React
import {
  Dialog,
  DialogContent,
  DialogDescription, // Add DialogDescription
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// import { Checkbox } from "@/components/ui/checkbox"; // Using custom selection instead
import { Plus, Calendar as CalendarIcon, icons as LucideIcons, LucideProps } from "lucide-react"; // Add CalendarIcon, LucideIcons, LucideProps
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Import cn utility
import { Calendar } from "@/components/ui/calendar"; // Import Calendar
import {
  Popover, // Import Popover components
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"; // Import Avatar
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { NewChoreData } from "@/lib/types"; // Import the shared type

// Remove the local interface definition below
// interface NewChoreData {
//   title: string;
//   dueDate: Date | undefined;
//   assignedMemberIds: string[];
//   points: number; // Assuming points are still needed, add input if necessary
//   isRecurring: boolean;
//   recurrence?: {
//     frequency: number;
//     unit: 'day' | 'week' | 'month';
//     endDate?: Date;
//   };
// }

interface AddChoreDialogProps {
  onAddChore: (data: NewChoreData) => void; // Use imported type
  // Pass full family member data including avatar and color if available
  familyMembers: Array<{ id: string; name: string; avatar?: string; color?: string | null }>;
}

export default function AddChoreDialog({
  onAddChore,
  familyMembers,
}: AddChoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // Add state for description
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [points, setPoints] = useState(10); // Default points, adjust as needed
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'day' | 'week' | 'month'>('day');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [showRecurrenceEndDate, setShowRecurrenceEndDate] = useState(false);
  const [iconName, setIconName] = useState(""); // Add state for icon name
  const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]); // State for suggestions
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "all_day">("all_day");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription(""); // Reset description state
      setSelectedDate(new Date());
      setAssignedMemberIds([]);
      setPoints(10);
      setIsRecurring(false);
      setRecurrenceFrequency(1);
      setRecurrenceUnit('day');
      setRecurrenceEndDate(undefined);
      setShowRecurrenceEndDate(false);
      setIconName(""); // Reset icon name
      setSuggestedIcons([]); // Reset suggestions
      setTimeOfDay("all_day");
    }
  }, [open]);

  // Effect to update icon suggestions based on title
  useEffect(() => {
    if (!title.trim()) {
      setSuggestedIcons([]);
      return;
    }

    const allIconNames = Object.keys(LucideIcons);
    const lowerCaseTitle = title.toLowerCase();
    const titleWords = lowerCaseTitle.split(' ').filter(word => word.length > 1); // Ignore very short words

    const filteredIcons = allIconNames.filter(name => {
      const lowerCaseIconName = name.toLowerCase();
      // Prioritize icons that include the whole title or significant parts
      if (lowerCaseIconName.includes(lowerCaseTitle)) return true;
      // Check if icon name includes any word from the title
      return titleWords.some(word => lowerCaseIconName.includes(word));
    }).slice(0, 5); // Limit to 5 suggestions

    setSuggestedIcons(filteredIcons);

  }, [title]);


  const handleMemberSelect = (memberId: string) => {
    setAssignedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedMemberIds.length === 0 || !selectedDate) return;

    const choreData: NewChoreData = {
      title,
      description, // Add description to data object
      dueDate: selectedDate,
      assignedMemberIds,
      points,
      isRecurring,
      icon: iconName || undefined, // Add icon to data object, make undefined if empty
      time_of_day: timeOfDay,
    };

    if (isRecurring) {
      choreData.recurrence = {
        frequency: recurrenceFrequency,
        unit: recurrenceUnit,
        endDate: showRecurrenceEndDate ? recurrenceEndDate : undefined,
      };
    }

    onAddChore(choreData);
    setOpen(false); // Close dialog after submission
  };

  const getSelectedMemberNames = () => {
    return familyMembers
      .filter((m) => assignedMemberIds.includes(m.id))
      .map((m) => m.name)
      .join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Chore
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md"> {/* Adjusted width */}
        <DialogHeader>
          <DialogTitle>Add Chore</DialogTitle>
          <DialogDescription>Add a new chore for your family.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chore Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Chore</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Make the bed"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description} // Need to add state for description
              onChange={(e) => setDescription(e.target.value)} // Need to add state setter
              placeholder="e.g., Make bed, organize toys..."
            />
          </div>

          {/* Icon Name Input */}
          <div className="space-y-1">
            <Label htmlFor="iconName">Icon Name (Optional)</Label>
            <Input
              id="iconName"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="e.g., Bed, Trash2, WashingMachine"
            />
            <p className="text-xs text-muted-foreground">
              Use any icon name from <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev/icons</a>.
            </p>
            {suggestedIcons.length > 0 && (
              <div className="mt-2 space-y-1 border rounded-md p-2 max-h-32 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                {suggestedIcons.map((sIconName) => {
                  const IconComponent = LucideIcons[sIconName as keyof typeof LucideIcons] as React.FC<LucideProps>;
                  return (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      key={sIconName}
                      onClick={() => {
                        setIconName(sIconName);
                        setSuggestedIcons([]); // Hide suggestions after click
                      }}
                      className="w-full justify-start text-left h-auto py-1 px-2"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                      {sIconName}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
             <Label>Date</Label>
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   variant={"outline"}
                   className={cn(
                     "w-full justify-start text-left font-normal",
                     !selectedDate && "text-muted-foreground"
                   )}
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0">
                 <Calendar
                   mode="single"
                   selected={selectedDate}
                   onSelect={setSelectedDate}
                   initialFocus
                 />
               </PopoverContent>
             </Popover>
           </div>
 
           {/* Time of Day Selection */}
           <div className="space-y-1">
             <Label htmlFor="time-of-day">Time of Day</Label>
             <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as "morning" | "afternoon" | "all_day")}>
               <SelectTrigger id="time-of-day">
                 <SelectValue placeholder="Select time of day" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all_day">All Day</SelectItem>
                 <SelectItem value="morning">Morning</SelectItem>
                 <SelectItem value="afternoon">Afternoon</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
          {/* Assign To */}
          <div className="space-y-1">
            <Label>Assign to: <span className="text-muted-foreground text-sm">{getSelectedMemberNames()}</span></Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {familyMembers.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => handleMemberSelect(member.id)}
                  className={cn(
                    "rounded-full border-2 p-0.5 transition-opacity",
                    assignedMemberIds.includes(member.id)
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-50 hover:opacity-75"
                  )}
                  style={{ borderColor: assignedMemberIds.includes(member.id) ? member.color || 'hsl(var(--primary))' : undefined }}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>

          {/* Points Input (Optional - Add if needed) */}
           <div className="space-y-1">
             <Label htmlFor="points">Points</Label>
             <Input
               id="points"
               type="number"
               min="0"
               value={points}
               onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
               required
             />
           </div>

          {/* Repeats Toggle */}
          <div className="flex items-center justify-between space-x-2 pt-2">
             <Label htmlFor="repeats-switch">Repeats</Label>
             <Switch
               id="repeats-switch"
               checked={isRecurring}
               onCheckedChange={setIsRecurring}
             />
           </div>

          {/* Recurrence Options (Conditional) */}
          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Label htmlFor="repeats-every" className="flex-shrink-0">Repeats every</Label>
                <Input
                  id="repeats-every"
                  type="number"
                  min="1"
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(parseInt(e.target.value) || 1)}
                  className="w-16"
                />
                <Select value={recurrenceUnit} onValueChange={(v) => setRecurrenceUnit(v as 'day' | 'week' | 'month')}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between space-x-2">
                 <Label htmlFor="repeats-until-switch">Repeats until</Label>
                 <Switch
                   id="repeats-until-switch"
                   checked={showRecurrenceEndDate}
                   onCheckedChange={setShowRecurrenceEndDate}
                 />
               </div>
               {showRecurrenceEndDate && (
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant={"outline"}
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !recurrenceEndDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>Pick end date</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0">
                     <Calendar
                       mode="single"
                       selected={recurrenceEndDate}
                       onSelect={setRecurrenceEndDate}
                       disabled={(date) => date < new Date()} // Disable past dates
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               )}
            </div>
          )}

          <Button type="submit" className="w-full">
            Save Chore
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
