'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { branches } from '@/config/branches';

export default function NewAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<(string | number)[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'normal',
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranches.length === 0) {
      alert('Please select at least one branch');
      return;
    }

    setLoading(true);

    try {
      // Create assignment
      const assignmentData = {
        ...formData,
        branches: selectedBranches.length === branches.length ? 'ALL' : selectedBranches,
        allocatedDate: Timestamp.now(),
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        overallStatus: 'pending',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'assignments'), assignmentData);

      // Create branch progress records
      const branchesToTrack = selectedBranches.length === branches.length ? 
        branches.map(b => b.code) : selectedBranches;

      for (const branchCode of branchesToTrack) {
        await addDoc(collection(db, 'branchProgress'), {
          assignmentId: docRef.id,
          branchCode,
          status: 'pending',
          completionDate: null,
          remarks: '',
          createdAt: Timestamp.now()
        });
      }

      alert('Assignment created successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const toggleBranch = (branchCode: string | number) => {
    setSelectedBranches(prev => {
      if (prev.includes(branchCode)) {
        return prev.filter(code => code !== branchCode);
      } else {
        return [...prev, branchCode];
      }
    });
  };

  const selectAllBranches = () => {
    setSelectedBranches(branches.map(b => b.code));
  };

  const clearAllBranches = () => {
    setSelectedBranches([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Assignment</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Assignment Title*
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Deadline
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Priority
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Branches*
            </label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={selectAllBranches}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllBranches}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
              >
                Clear All
              </button>
              <span className="ml-auto text-sm text-gray-600">
                Selected: {selectedBranches.length}/{branches.length}
              </span>
            </div>

            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {branches.map((branch) => (
                <label
                  key={branch.code}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch.code)}
                    onChange={() => toggleBranch(branch.code)}
                    className="mr-3"
                  />
                  <span>{branch.code} - {branch.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}