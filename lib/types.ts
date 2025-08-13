
export interface Project {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    deadline: Date;
    status: 'active' | 'completed' | 'on-hold';
    createdAt: Date;
    createdBy: string;
  }
  
  export interface Assignment {
    id: string;
    projectId: string;
    title: string;
    description: string;
    allocatedDate: Date;
    deadline: Date;
    branches: string[] | 'ALL';
    overallStatus: 'pending' | 'in-progress' | 'completed';
    emailsSent: boolean;
    createdAt: Date;
    createdBy: string;
  }
  
  export interface BranchProgress {
    id: string;
    assignmentId: string;
    branchId: string;
    status: 'pending' | 'in-progress' | 'completed';
    completionDate?: Date;
    followUps: number;
    lastFollowUp?: Date;
    notes?: string;
  }