'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline?: Timestamp;
  priority: string;
  branches: string | (string | number)[];
  createdAt: Timestamp;
  overallStatus: string;
}

interface BranchProgress {
  id: string;
  assignmentId: string;
  branchCode: string | number;
  status: string;
  completionDate?: Timestamp;
  remarks?: string;
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [branchProgress, setBranchProgress] = useState<BranchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for assignments
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
      setAssignments(data);
      setLoading(false);
    });

    // Real-time listener for branch progress
    const progressQuery = query(collection(db, 'branchProgress'));
    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BranchProgress));
      setBranchProgress(data);
    });

    return () => {
      unsubscribe();
      unsubscribeProgress();
    };
  }, []);

  const updateBranchStatus = async (progressId: string, status: string) => {
    try {
      const updates: {[key: string]: any} = { status };
      if (status === 'completed') {
        updates.completionDate = Timestamp.now();
      }
      await updateDoc(doc(db, 'branchProgress', progressId), updates);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getAssignmentProgress = (assignmentId: string) => {
    const progress = branchProgress.filter(p => p.assignmentId === assignmentId);
    const completed = progress.filter(p => p.status === 'completed').length;
    return { total: progress.length, completed };
  };

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCompleted = branchProgress.filter(p => {
      if (p.status === 'completed' && p.completionDate) {
        const completionDate = p.completionDate.toDate();
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === today.getTime();
      }
      return false;
    }).length;

    const totalPending = branchProgress.filter(p => p.status === 'pending').length;
    
    return { todayCompleted, totalPending };
  };

  const stats = getTodayStats();

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Assignment Tracker</h1>
          <Link
            href="/assignments/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Assignment
          </Link>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today&apos;s Completions</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayCompleted}</p>
              </div>
              <CheckCircle className="text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
              </div>
              <Clock className="text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <Calendar className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const progress = getAssignmentProgress(assignment.id);
            const assignmentProgress = branchProgress.filter(p => p.assignmentId === assignment.id);
            
            return (
              <div key={assignment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-gray-600 mt-1">{assignment.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Created: {assignment.createdAt?.toDate().toLocaleDateString()}</span>
                      {assignment.deadline && (
                        <span>Deadline: {assignment.deadline.toDate().toLocaleDateString()}</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        assignment.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        assignment.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{progress.completed}/{progress.total}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>

                {/* Branch Progress */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Branch Progress:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {assignmentProgress.map((prog) => {
                      const branch = branches.find(b => b.code === prog.branchCode || b.code === Number(prog.branchCode));
                      return (
                        <div key={prog.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{branch?.name || prog.branchCode}</span>
                          <button
                            onClick={() => updateBranchStatus(
                              prog.id, 
                              prog.status === 'completed' ? 'pending' : 'completed'
                            )}
                            className={`px-3 py-1 rounded text-xs ${
                              prog.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {prog.status}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No assignments yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}