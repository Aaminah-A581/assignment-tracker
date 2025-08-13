// API configuration
const API_URL = 'http://localhost:3000'; // For JSON Server
// const API_URL = 'https://your-api.com'; // For production

const API = {
    // Get all assignments
    async getAssignments() {
        try {
            const response = await fetch(`${API_URL}/assignments`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching assignments:', error);
            return JSON.parse(localStorage.getItem('assignments') || '[]');
        }
    },

    // Create new assignment
    async createAssignment(data) {
        try {
            const response = await fetch(`${API_URL}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const newAssignment = { ...data, id: Date.now().toString() };
            assignments.push(newAssignment);
            localStorage.setItem('assignments', JSON.stringify(assignments));
            return newAssignment;
        }
    },

    // Update assignment
    async updateAssignment(id, data) {
        try {
            const response = await fetch(`${API_URL}/assignments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const index = assignments.findIndex(a => a.id === id);
            if (index !== -1) {
                assignments[index] = { ...assignments[index], ...data };
                localStorage.setItem('assignments', JSON.stringify(assignments));
            }
            return assignments[index];
        }
    },

    // Delete assignment
    async deleteAssignment(id) {
        try {
            await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });
        } catch (error) {
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const filtered = assignments.filter(a => a.id !== id);
            localStorage.setItem('assignments', JSON.stringify(filtered));
        }
    }
};

// Global functions for inline handlers
async function updateStatus(id, newStatus) {
    await API.updateAssignment(id, { status: newStatus });
    loadAssignments();
}

async function deleteAssignment(id) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        await API.deleteAssignment(id);
        loadAssignments();
    }
}