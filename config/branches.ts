export interface Branch {
    id: string;
    name: string;
    emails: string[];
    region?: string;
  }
  
  export const branches: Branch[] = [
    { id: 'RO', name: 'Regional Office', emails: ['ro.admin@company.com', 'ro.manager@company.com', 'ro.head@company.com'], region: 'HQ' },
    { id: 'BR001', name: 'Branch 001 - Downtown', emails: ['br001.admin@company.com', 'br001.manager@company.com'], region: 'Central' },
    { id: 'BR002', name: 'Branch 002 - Westside', emails: ['br002.admin@company.com', 'br002.manager@company.com'], region: 'West' },
    // ... add all 34 branches
  ];