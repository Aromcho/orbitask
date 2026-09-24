// Tipos que devuelve el backend (ver backend/src/**/*.schema.ts)

export interface User {
  id: string;
  email: string;
  name: string;
}

interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ---------- Tareas ----------

export type Priority = "baja" | "media" | "alta";

export interface TaskList extends Timestamps {
  id: string;
  title: string;
  color: string;
  position: number;
}

export interface Task extends Timestamps {
  id: string;
  listId: string;
  title: string;
  description: string;
  priority: Priority;
  due: string | null; // YYYY-MM-DD
  done: boolean;
  position: number;
}

// ---------- Calendario ----------

export type EventCategory = "personal" | "trabajo" | "salud" | "social" | "estudio" | "otro";

export interface CalendarEvent extends Timestamps {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  category: EventCategory;
  location: string;
  notes: string;
}

// ---------- Hábitos ----------

export interface Habit extends Timestamps {
  id: string;
  name: string;
  emoji: string;
  color: string;
  days: number[]; // 0 = domingo
  archived: boolean;
  currentStreak: number;
  bestStreak: number;
  position: number;
}

export interface HabitCheckin {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
}

// ---------- Finanzas ----------

export type MovementType = "income" | "expense";

export interface Category extends Timestamps {
  id: string;
  name: string;
  type: MovementType;
  color: string;
  emoji: string;
}

export interface Transaction extends Timestamps {
  id: string;
  type: MovementType;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string;
  recurringId: string | null;
}

export interface Recurring extends Timestamps {
  id: string;
  type: MovementType;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  note: string;
  active: boolean;
  lastRunMonth: string | null;
}

export interface FinanceSummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  byCategory: { categoryId: string; name: string; color: string; emoji: string; total: number }[];
  daily: { date: string; income: number; expense: number }[];
}

// ---------- Deseos ----------

export interface Wish extends Timestamps {
  id: string;
  title: string;
  url: string;
  image: string;
  siteName: string;
  description: string;
  price: number | null;
  currency: string;
  priority: Priority;
  notes: string;
  purchased: boolean;
  purchasedAt: string | null;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  price: number | null;
  currency: string | null;
}
