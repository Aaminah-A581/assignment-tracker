/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle, TrendingUp, Building2, AlertCircle, ChevronRight, Target, Award } from 'lucide-react';

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
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
      setAssignments(data);
      setLoading(false);
    });

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
      if (status === 'completed') {
        await updateDoc(doc(db, 'branchProgress', progressId), {
          status,
          completionDate: Timestamp.now()
        });
      } else {
        await updateDoc(doc(db, 'branchProgress', progressId), {
          status
        });
      }
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
    const overdueTasks = assignments.filter(a => {
      if (a.deadline) {
        return a.deadline.toDate() < new Date() && a.overallStatus !== 'completed';
      }
      return false;
    }).length;
    
    return { todayCompleted, totalPending, overdueTasks };
  };

  const stats = getTodayStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignment Tracker</h1>
              <p className="text-gray-500 mt-1">Manage and track branch assignments efficiently</p>
            </div>
            <Link
              href="/assignments/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Plus size={20} />
              New Assignment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Completions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayCompleted}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp size={16} className="inline mr-1" />
                  Great progress!
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPending}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  <Clock size={16} className="inline mr-1" />
                  Awaiting completion
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Target className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdueTasks}</p>
                <p className="text-xs text-red-600 mt-1">
                  <AlertCircle size={16} className="inline mr-1" />
                  Need attention
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Branches</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">36</p>
                <p className="text-xs text-blue-600 mt-1">
                  <Building2 size={16} className="inline mr-1" />
                  All regions
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Award className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Active Assignments</h2>
          </div>
          
          <div className="p-6">
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Calendar className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 text-lg">No assignments yet</p>
                <p className="text-gray-400 mt-2">Create your first assignment to get started</p>
                <Link
                  href="/assignments/new"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Create Assignment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const progress = getAssignmentProgress(assignment.id);
                  const assignmentProgress = branchProgress.filter(p => p.assignmentId === assignment.id);
                  const isOverdue = assignment.deadline && assignment.deadline.toDate() < new Date();
                  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                  
                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                assignment.priority === 'urgent' ? 'bg-red-100 text-red-700 animate-pulse' :
                                assignment.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                assignment.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {assignment.priority.toUpperCase()}
                              </span>
                              {isOverdue && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-gray-600 mt-2">{assignment.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                Created: {assignment.createdAt?.toDate().toLocaleDateString()}
                              </span>
                              {assignment.deadline && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Clock size={16} />
                                  Deadline: {assignment.deadline.toDate().toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Building2 size={16} />
                                {assignment.branches === 'ALL' ? 'All 36 Branches' : `${Array.isArray(assignment.branches) ? assignment.branches.length : 0} Branches`}
                              </span>
                            </div>
                          </div>
                          <div className="text-center ml-6">
                            <div className="relative inline-flex items-center justify-center">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 36}`}
                                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercentage / 100)}`}
                                  className={progressPercentage === 100 ? 'text-green-500' : 'text-blue-500'}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute">
                                <p className="text-xl font-bold">{Math.round(progressPercentage)}%</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{progress.completed}/{progress.total}</p>
                          </div>
                        </div>

                        {/* Branch Progress Grid */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-700">Branch Progress</h4>
                            <ChevronRight className="text-gray-400" size={20} />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {assignmentProgress.slice(0, 8).map((prog) => {
                              const branch = branches.find(b => b.code === prog.branchCode || b.code === Number(prog.branchCode));
                              return (
                                <button
                                  key={prog.id}
                                  onClick={() => updateBranchStatus(
                                    prog.id, 
                                    prog.status === 'completed' ? 'pending' : 'completed'
                                  )}
                                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                    prog.status === 'completed' 
                                      ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {branch?.name.split(' - ')[0] || prog.branchCode}
                                  </p>
                                  <p className={`text-xs mt-1 ${
                                    prog.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {prog.status === 'completed' ? '✓ Completed' : 'Pending'}
                                  </p>
                                </button>
                              );
                            })}
                            {assignmentProgress.length > 8 && (
                              <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                                <p className="text-sm text-gray-500">+{assignmentProgress.length - 8} more</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}