'use client';
import { useState } from 'react';
import { branches } from '@/config/branches';
import { Check } from 'lucide-react';

interface BranchSelectorProps {
  selectedBranches: (string | number)[];
  onSelectionChange: (branches: (string | number)[]) => void;
}

export default function BranchSelector({ selectedBranches, onSelectionChange }: BranchSelectorProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(branches.map(b => b.code));
    } else {
      onSelectionChange([]);
    }
  };

  const handleBranchToggle = (branchCode: string | number) => {
    if (selectAll) setSelectAll(false);
    
    if (selectedBranches.includes(branchCode)) {
      onSelectionChange(selectedBranches.filter(code => code !== branchCode));
    } else {
      onSelectionChange([...selectedBranches, branchCode]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="p-3 bg-blue-50 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="mr-3 h-5 w-5 text-blue-600"
          />
          <span className="font-semibold text-blue-700">
            SELECT ALL BRANCHES ({branches.length})
          </span>
        </label>
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg p-2">
        {branches.map((branch) => (
          <label
            key={branch.code}
            className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedBranches.includes(branch.code)}
              onChange={() => handleBranchToggle(branch.code)}
              className="mr-3 h-4 w-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium">{branch.name}</div>
              <div className="text-sm text-gray-500">
                Code: {branch.code} • {branch.emails.length} email contacts
              </div>
            </div>
            {selectedBranches.includes(branch.code) && (
              <Check className="text-green-500" size={20} />
            )}
          </label>
        ))}
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Selected: {selectAll ? 'ALL BRANCHES' : `${selectedBranches.length} branch(es)`}
        </p>
      </div>
    </div>
  );
}