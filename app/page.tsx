'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);
    });
    return () => unsubscribe();
  }, []);

  const addAssignment = async (e) => {
    e.preventDefault();
    if (newAssignment.trim()) {
      await addDoc(collection(db, 'assignments'), {
        title: newAssignment,
        createdAt: new Date(),
        status: 'pending'
      });
      setNewAssignment('');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Assignment Tracker</h1>
      
      <form onSubmit={addAssignment} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newAssignment}
          onChange={(e) => setNewAssignment(e.target.value)}
          placeholder="Enter new assignment..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button 
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {assignments.map(assignment => (
          <div key={assignment.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{assignment.title}</h3>
            <p className="text-sm text-gray-500">
              Status: {assignment.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}