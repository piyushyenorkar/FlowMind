export interface User {
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  teams?: any[];
  photoUrl?: string;
}

export interface Team {
  id?: string | number;
  code: string;
  projectName: string;
  description: string;
  deadline: string;
  leaderName: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isLeader: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedHours: number;
  actualHours: number;
  deadline?: string;
  createdAt: string;
  updates: TaskUpdate[];
}

export interface TaskUpdate {
  text: string;
  author: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  decision: string;
  reason?: string;
  impact?: string;
  people?: string;
  outcome?: string;
  createdAt: string;
}

export interface Meeting {
  id?: string;
  title: string;
  date?: string;
  tasksCreated?: any[];
  [key: string]: any;
}

export interface MemoryFeedItem {
  id: number | string;
  type: string;
  timestamp: string;
  text: string;
  icon: string;
  meta?: any;
}
