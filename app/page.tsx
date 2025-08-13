/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';
import Link from 'next/link';
import { Plus, CheckCircle, Clock, Users, TrendingUp, Eye } from 'lucide-react';

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
  const [showBranches, setShowBranches] = useState<{[key: string]: boolean}>({});

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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎯 Assignment Tracker</h1>
            <p className="text-pink-100">Managing {branches.length} branches efficiently</p>
          </div>
          <Link href="/assignments/new" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-full transform hover:scale-110 transition-all shadow-xl flex items-center gap-2">
            <Plus size={24} />
            NEW ASSIGNMENT
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto -mt-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all">
            <CheckCircle size={40} className="mb-2" />
            <p className="text-4xl font-bold">{stats.todayCompleted}</p>
            <p className="text-green-100">Completed Today</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all">
            <Clock size={40} className="mb-2" />
            <p className="text-4xl font-bold">{stats.totalPending}</p>
            <p className="text-yellow-100">Total Pending</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all">
            <TrendingUp size={40} className="mb-2" />
            <p className="text-4xl font-bold">{stats.totalCompleted}</p>
            <p className="text-blue-100">Total Completed</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all">
            <Users size={40} className="mb-2" />
            <p className="text-4xl font-bold">{assignments.length}</p>
            <p className="text-purple-100">Active Tasks</p>
          </div>
        </div>
      </div>

      {/* Assignments */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">📋 Active Assignments</h2>
        
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-xl text-gray-500 mb-4">No assignments yet!</p>
            <Link href="/assignments/new" className="text-blue-600 hover:text-blue-800 font-semibold">
              Create your first assignment →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              const assignmentProgress = branchProgress.filter(p => p.assignmentId === assignment.id);
              const completed = assignmentProgress.filter(p => p.status === 'completed').length;
              const total = assignmentProgress.length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isExpanded = showBranches[assignment.id];
              
              return (
                <div key={assignment.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                  <div className="p-6">
                    {/* Assignment Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-gray-600 mb-3">{assignment.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                            assignment.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                            assignment.priority === 'high' ? 'bg-orange-500' :
                            assignment.priority === 'normal' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}>
                            {assignment.priority.toUpperCase()}
                          </span>
                          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm">
                            {assignment.branches === 'ALL' ? '🌍 ALL 36 BRANCHES' : `📍 ${Array.isArray(assignment.branches) ? assignment.branches.length : 0} BRANCHES`}
                          </span>
                          {assignment.deadline && (
                            <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full font-semibold text-sm">
                              📅 Due: {assignment.deadline.toDate().toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Circle */}
                      <div className="ml-6 text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white ${
                          percentage === 100 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                          percentage >= 75 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          percentage >= 50 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          percentage >= 25 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          {percentage}%
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{completed}/{total} done</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            'bg-gradient-to-r from-yellow-400 to-orange-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* View Branches Button */}
                    <button
                      onClick={() => setShowBranches({...showBranches, [assignment.id]: !isExpanded})}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={20} />
                      {isExpanded ? 'HIDE' : 'VIEW'} BRANCH DETAILS
                    </button>

                    {/* Branch Details */}
                    {isExpanded && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignmentProgress.map((prog) => {
                          const branch = branches.find(b => b.code === prog.branchCode || b.code === Number(prog.branchCode));
                          const isCompleted = prog.status === 'completed';
                          
                          return (
                            <button
                              key={prog.id}
                              onClick={() => updateBranchStatus(prog.id, isCompleted ? 'pending' : 'completed')}
                              className={`p-4 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 border-2 border-green-400' 
                                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 hover:from-yellow-100 hover:to-yellow-200'
                              }`}
                            >
                              <p className="font-bold">{branch?.code}</p>
                              <p className="text-sm">{branch?.name || 'Unknown Branch'}</p>
                              <p className="mt-2">
                                {isCompleted ? (
                                  <span className="text-green-600">✅ COMPLETED</span>
                                ) : (
                                  <span className="text-orange-600">⏳ PENDING</span>
                                )}
                              </p>
                              {prog.completionDate && (
                                <p className="text-xs mt-1">
                                  Done: {prog.completionDate.toDate().toLocaleDateString()}
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
  );
}