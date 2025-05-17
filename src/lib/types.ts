export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  // level: number; // Removed
  // progress: number; // Removed
  // streak: number; // Removed
  color?: string | null;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  points: number;

  status: "pending" | "completed";
  created_at?: string;
  routine_id?: string;
  routine_title?: string;
  is_default: boolean;
  due_date: string;
  is_recurring?: boolean; // Added for recurring logic
  original_chore_id?: string | null; // Added for recurring logic
  // routine_color?: string | null; // Remove this, color comes via join
  routines?: { color: string | null } | null; // Add nested routines object from join
  icon?: string | null; // Added for chore icon
}

// Add Routine type definition
export interface Routine {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  color?: string | null; // Add optional color
  active_days?: number[];
  routine_chores?: { // Assuming this structure based on ChoreManager usage
    id: string;
    title: string;
    points: number;
  }[];
}

// Add NewChoreData interface for the Add Chore Dialog
export interface NewChoreData {
  title: string;
  dueDate: Date | undefined;
  assignedMemberIds: string[];
  points: number;
description?: string; // Add optional description
  isRecurring: boolean;
  recurrence?: {
    frequency: number;
    unit: 'day' | 'week' | 'month';
    endDate?: Date;
  };
  icon?: string; // Added for chore icon
}

// Interface for Rewards
export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string | null;
  created_at?: string; // Optional
}
