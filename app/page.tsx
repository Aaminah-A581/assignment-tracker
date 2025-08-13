/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle, FileText, Users, AlertCircle, Mail, Building, TrendingUp, X } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline?: Timestamp;
  priority: string;
  category?: string;
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
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

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

  const getDaysUntilDeadline = (deadline: Timestamp) => {
    const today = new Date();
    const deadlineDate = deadline.toDate();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = getTodayStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="text-yellow-300" size={32} />
                Work Assignment Tracker
              </h1>
              <p className="text-blue-100 mt-1">Manage assignments across all 36 branches efficiently</p>
            </div>
            <Link
              href="/assignments/new"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 hover:text-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={20} />
              New Assignment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Colorful Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Today&apos;s Completions</p>
                <p className="text-4xl font-bold mt-2">{stats.todayCompleted}</p>
                <p className="text-green-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Great progress!
                </p>
              </div>
              <div className="bg-white bg-opacity-30 p-3 rounded-full">
                <CheckCircle size={28} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Tasks</p>
                <p className="text-4xl font-bold mt-2">{stats.totalPending}</p>
                <p className="text-yellow-100 text-xs mt-1 flex items-center gap-1">
                  <Clock size={14} />
                  In progress
                </p>
              </div>
              <div className="bg-white bg-opacity-30 p-3 rounded-full">
                <Clock size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Overdue</p>
                <p className="text-4xl font-bold mt-2">{stats.overdueTasks}</p>
                <p className="text-red-100 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Need attention
                </p>
              </div>
              <div className="bg-white bg-opacity-30 p-3 rounded-full">
                <AlertCircle size={28} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Branches</p>
                <p className="text-4xl font-bold mt-2">36</p>
                <p className="text-purple-100 text-xs mt-1 flex items-center gap-1">
                  <Building size={14} />
                  All regions
                </p>
              </div>
              <div className="bg-white bg-opacity-30 p-3 rounded-full">
                <Users size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText size={24} />
              Active Assignments
            </h2>
          </div>
          
          <div className="p-6">
            {assignments.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                  <Calendar className="text-blue-600" size={40} />
                </div>
                <p className="text-gray-600 text-xl font-medium">No assignments yet</p>
                <p className="text-gray-400 mt-2">Create your first assignment to get started</p>
                <Link
                  href="/assignments/new"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Plus size={20} />
                  Create First Assignment
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => {
                  const progress = getAssignmentProgress(assignment.id);
                  const assignmentProgress = branchProgress.filter(p => p.assignmentId === assignment.id);
                  const isOverdue = assignment.deadline && assignment.deadline.toDate() < new Date();
                  const daysLeft = assignment.deadline ? getDaysUntilDeadline(assignment.deadline) : null;
                  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                  const isExpanded = expandedAssignment === assignment.id;
                  
                  return (
                    <div 
                      key={assignment.id} 
                      className="border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-800">{assignment.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                assignment.priority === 'urgent' ? 'bg-red-500 text-white animate-pulse' :
                                assignment.priority === 'high' ? 'bg-orange-500 text-white' :
                                assignment.priority === 'normal' ? 'bg-blue-500 text-white' :
                                'bg-gray-400 text-white'
                              }`}>
                                {assignment.priority}
                              </span>
                              {assignment.category && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  {assignment.category}
                                </span>
                              )}
                              {isOverdue && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-bounce">
                                  OVERDUE
                                </span>
                              )}
                              {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                  {daysLeft} DAYS LEFT
                                </span>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-gray-600 mt-3">{assignment.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Calendar size={16} className="text-blue-500" />
                                <strong>Created:</strong> {assignment.createdAt?.toDate().toLocaleDateString()}
                              </span>
                              {assignment.deadline && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                  <Clock size={16} className={isOverdue ? 'text-red-500' : 'text-orange-500'} />
                                  <strong>Deadline:</strong> {assignment.deadline.toDate().toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-gray-500">
                                <Users size={16} className="text-purple-500" />
                                <strong>Branches:</strong> {assignment.branches === 'ALL' ? 'All 36' : Array.isArray(assignment.branches) ? assignment.branches.length : 0}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress Circle */}
                          <div className="text-center ml-6">
                            <div className="relative inline-flex items-center justify-center">
                              <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 40}`}
                                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercentage / 100)}`}
                                  className={
                                    progressPercentage === 100 ? 'text-green-500' : 
                                    progressPercentage >= 75 ? 'text-blue-500' :
                                    progressPercentage >= 50 ? 'text-yellow-500' :
                                    progressPercentage >= 25 ? 'text-orange-500' :
                                    'text-red-500'
                                  }
                                  strokeLinecap="round"
                                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                              </svg>
                              <div className="absolute">
                                <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
                                <p className="text-xs text-gray-500">{progress.completed}/{progress.total}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <div className="mt-6 pt-6 border-t-2 border-gray-100">
                          <button
                            onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <span className="font-medium text-gray-700">
                              Branch Progress Details
                            </span>
                            <span className="text-gray-400">
                              {isExpanded ? <X size={20} /> : <Plus size={20} />}
                            </span>
                          </button>
                        </div>

                        {/* Expandable Branch Progress */}
                        {isExpanded && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {assignmentProgress.map((prog) => {
                              const branch = branches.find(b => b.code === prog.branchCode || b.code === Number(prog.branchCode));
                              return (
                                <button
                                  key={prog.id}
                                  onClick={() => updateBranchStatus(
                                    prog.id, 
                                    prog.status === 'completed' ? 'pending' : 'completed'
                                  )}
                                  className={`p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                                    prog.status === 'completed' 
                                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 hover:from-green-100 hover:to-green-200' 
                                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:from-yellow-50 hover:to-yellow-100 hover:border-yellow-400'
                                  }`}
                                >
                                  <p className="font-semibold text-gray-800">
                                    {branch?.code} - {branch?.name.split(' - ')[0] || 'Unknown'}
                                  </p>
                                  <p className={`text-sm mt-2 font-medium ${
                                    prog.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {prog.status === 'completed' ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <CheckCircle size={16} />
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="flex items-center justify-center gap-1">
                                        <Clock size={16} />
                                        Pending
                                      </span>
                                    )}
                                  </p>
                                  {prog.completionDate && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {prog.completionDate.toDate().toLocaleDateString()}
                                    </p>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
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