
export interface Person {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name:string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
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
