/* Central domain entity typings used across the application.
 * These are intentionally lightweight – extend as the data model evolves.
 */

export interface BaseEntity {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  dueDate?: Date | string;
  completed: boolean;
  completedAt?: Date | string;
  priority?: number;
  type?: string; // e.g. work, personal
  durationMinutes?: number;
}

export interface Event extends BaseEntity {
  title: string;
  start: Date | string;
  end: Date | string;
  location?: string;
  description?: string;
}

export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  completed: boolean;
}

export interface Note extends BaseEntity {
  content: string;
  tags?: string[];
}

export interface Habit extends BaseEntity {
  title: string;
  streak: number;
  completedToday: boolean;
}

export interface Contact extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}
