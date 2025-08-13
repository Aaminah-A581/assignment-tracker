/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';
import Link from 'next/link';
import { Plus, CheckCircle, Clock, Users, TrendingUp, ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline?: Timestamp;
  priority: string;
  branches: string | (string | number)[];
  createdAt: Timestamp;
}

interface BranchProgress {
  id: string;
  assignmentId: string;
  branchCode: string | number;
  status: string;
  completionDate?: Timestamp;
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [branchProgress, setBranchProgress] = useState<BranchProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment)));
      setLoading(false);
    });

    const progressQuery = query(collection(db, 'branchProgress'));
    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
      setBranchProgress(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BranchProgress)));
    });

    return () => {
      unsubscribe();
      unsubscribeProgress();
    };
  }, []);

  const updateBranchStatus = async (progressId: string, status: string) => {
    await updateDoc(doc(db, 'branchProgress', progressId), {
      status,
      completionDate: status === 'completed' ? Timestamp.now() : null
    });
  };

  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCompleted = branchProgress.filter(p => {
      if (p.status === 'completed' && p.completionDate) {
        const date = p.completionDate.toDate();
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      }
      return false;
    }).length;

    const totalPending = branchProgress.filter(p => p.status === 'pending').length;
    const totalCompleted = branchProgress.filter(p => p.status === 'completed').length;

    return { todayCompleted, totalPending, totalCompleted };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ultra Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h1 className="text-xl font-bold">Assignment Tracker</h1>
            <span className="text-sm text-blue-100 hidden sm:inline">• {branches.length} branches</span>
          </div>
          <Link 
            href="/assignments/new" 
            className="bg-white text-blue-600 hover:bg-yellow-300 px-4 py-1.5 rounded font-bold text-sm transition-all flex items-center gap-1 shadow"
          >
            <Plus size={16} />
            NEW ASSIGNMENT
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Inline Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-4 flex items-center justify-around">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            <div>
              <span className="text-xl font-bold text-gray-800">{stats.todayCompleted}</span>
              <span className="text-sm text-gray-600 ml-1">Today</span>
            </div>
          </div>
          
          <div className="border-l pl-4 flex items-center gap-2">
            <Clock className="text-yellow-500" size={20} />
            <div>
              <span className="text-xl font-bold text-gray-800">{stats.totalPending}</span>
              <span className="text-sm text-gray-600 ml-1">Pending</span>
            </div>
          </div>
          
          <div className="border-l pl-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            <div>
              <span className="text-xl font-bold text-gray-800">{stats.totalCompleted}</span>
              <span className="text-sm text-gray-600 ml-1">Completed</span>
            </div>
          </div>
          
          <div className="border-l pl-4 flex items-center gap-2">
            <Users className="text-purple-500" size={20} />
            <div>
              <span className="text-xl font-bold text-gray-800">{assignments.length}</span>
              <span className="text-sm text-gray-600 ml-1">Active</span>
            </div>
          </div>
        </div>

        {/* Assignments Table View */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-lg text-gray-600 mb-3">No assignments yet!</p>
            <Link href="/assignments/new" className="text-blue-600 hover:text-blue-800 font-semibold">
              Create your first assignment →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => {
                    const assignmentProgress = branchProgress.filter(p => p.assignmentId === assignment.id);
                    const completed = assignmentProgress.filter(p => p.status === 'completed').length;
                    const total = assignmentProgress.length;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const isExpanded = expandedAssignment === assignment.id;
                    const isOverdue = assignment.deadline && assignment.deadline.toDate() < new Date();
                    
                    return (
                      <React.Fragment key={assignment.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                            {assignment.description && (
                              <div className="text-xs text-gray-500">{assignment.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              assignment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              assignment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              assignment.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {assignment.createdAt?.toDate().toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {assignment.deadline ? (
                              <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                {assignment.deadline.toDate().toLocaleDateString()}
                                {isOverdue && <AlertCircle className="inline ml-1" size={14} />}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {assignment.branches === 'ALL' ? 'All 36' : Array.isArray(assignment.branches) ? assignment.branches.length : 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        percentage === 100 ? 'bg-green-500' :
                                        percentage >= 50 ? 'bg-blue-500' :
                                        'bg-orange-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="ml-2 text-sm font-medium text-gray-700">{percentage}%</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{completed}/{total}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 bg-gray-50">
                              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {assignmentProgress.map((prog) => {
                                  const branch = branches.find(b => b.code === prog.branchCode || b.code === Number(prog.branchCode));
                                  const isCompleted = prog.status === 'completed';
                                  
                                  return (
                                    <button
                                      key={prog.id}
                                      onClick={() => updateBranchStatus(prog.id, isCompleted ? 'pending' : 'completed')}
                                      className={`p-2 rounded text-xs font-medium transition-all ${
                                        isCompleted 
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-yellow-50'
                                      }`}
                                      title={branch?.name || 'Unknown Branch'}
                                    >
                                      <div className="font-bold">{branch?.code}</div>
                                      <div className="text-xs opacity-75">{isCompleted ? '✓' : '○'}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}