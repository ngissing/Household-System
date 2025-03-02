export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  progress: number;
  streak: number;
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
}
