
export interface Person {
  id: string;
  name: string;
  teamIds: string[];
  role?: string;
  managerId?: string;
}

export interface Team {
  id: string;
  name:string;
  leaderId?: string;
}

export interface Project {
  id: string;
  name: string;
  projectManagerId?: string;
}

export type TaskStatus = 'In-progress' | 'Done' | 'On-hold' | 'Cancelled';

export interface Task {
  id: string;
  name: string;
  projectId: string;
  status: TaskStatus;
  progress: number;
  eta: string; // Estimated Time of Arrival/Completion
}

export interface Assignment {
  personId: string;
  taskId: string;
}

export interface StructuredData {
  teams: Team[];
  people: Person[];
  projects: Project[];
  tasks: Task[];
  assignments: Assignment[];
  riskAnalysis: string;
}
