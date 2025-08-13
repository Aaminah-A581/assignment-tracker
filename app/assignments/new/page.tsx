'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BranchSelector from '@/components/BranchSelector';
import toast from 'react-hot-toast';

export default function NewAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    description: '',
    deadline: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create assignment
      const assignmentData = {
        ...formData,
        branches: selectedBranches.length === branches.length ? 'ALL' : selectedBranches,
        allocatedDate: Timestamp.now(),
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
        overallStatus: 'pending',
        emailsSent: false,
        createdAt: Timestamp.now(),
        createdBy: 'current-user-id' // Replace with actual user ID
      };

      const docRef = await addDoc(collection(db, 'assignments'), assignmentData);

      // Create branch progress records
      const branchesToTrack = selectedBranches.length === branches.length ? 
        branches.map(b => b.id) : selectedBranches;

      for (const branchId of branchesToTrack) {
        await addDoc(collection(db, 'branchProgress'), {
          assignmentId: docRef.id,
          branchId,
          status: 'pending',
          followUps: 0,
          createdAt: Timestamp.now()
        });
      }

      // Send emails (call API route)
      await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: docRef.id,
          branches: branchesToTrack,
          assignmentData
        })
      });

      toast.success('Assignment created and emails sent!');
      router.push('/assignments');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Assignment</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Assignment Title
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Branches
          </label>
          <BranchSelector
            selectedBranches={selectedBranches}
            onSelectionChange={setSelectedBranches}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Deadline
          </label>
          <input
            type="date"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedBranches.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Creating...' : 'Create & Send Emails'}
          </button>
        </div>
      </form>
    </div>
  );
}