// State Management
let assignments = [];
let currentFilter = { subject: '', status: '' };
let currentSort = 'dueDate';
let viewMode = 'grouped'; // 'grouped' or 'list'

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadAssignments();
    setupEventListeners();
    updateStats();
});

// Event Listeners
function setupEventListeners() {
    // Form toggle
    document.getElementById('toggleForm').addEventListener('click', () => {
        document.getElementById('assignmentForm').classList.toggle('hidden');
    });

    // Form submission
    document.getElementById('assignmentForm').addEventListener('submit', handleSubmit);

    // Cancel button
    document.getElementById('cancelForm').addEventListener('click', () => {
        document.getElementById('assignmentForm').reset();
        document.getElementById('assignmentForm').classList.add('hidden');
    });

    // Filters and sorting
    document.getElementById('filterSubject').addEventListener('change', (e) => {
        currentFilter.subject = e.target.value;
        renderAssignments();
    });

    document.getElementById('filterStatus').addEventListener('change', (e) => {
        currentFilter.status = e.target.value;
        renderAssignments();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderAssignments();
    });

    // View mode toggle
    document.getElementById('viewToggle').addEventListener('change', (e) => {
        viewMode = e.target.value;
        renderAssignments();
    });
}

// CRUD Operations
async function loadAssignments() {
    assignments = await API.getAssignments();
    renderAssignments();
    populateSubjectFilter();
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        subject: document.getElementById('subject').value,
        description: document.getElementById('description').value,
        dueDate: document.getElementById('dueDate').value,
        priority: document.getElementById('priority').value,
        estimatedHours: parseInt(document.getElementById('estimatedHours').value) || 0,
        status: 'not_started',
        actualHours: 0,
        createdAt: new Date().toISOString()
    };

    const newAssignment = await API.createAssignment(formData);
    assignments.push(newAssignment);
    
    renderAssignments();
    updateStats();
    populateSubjectFilter();
    e.target.reset();
    document.getElementById('assignmentForm').classList.add('hidden');
}

// Rendering Functions
function renderAssignments() {
    const filtered = filterAssignments();
    const sorted = sortAssignments(filtered);
    
    const container = document.getElementById('assignmentsList');
    
    if (viewMode === 'grouped') {
        container.innerHTML = renderGroupedView(sorted);
        container.className = 'assignments-grouped';
    } else {
        container.innerHTML = sorted.map(assignment => 
            createAssignmentCard(assignment)
        ).join('');
        container.className = 'assignments-grid';
    }
}

function renderGroupedView(assignments) {
    // Group assignments by subject
    const grouped = assignments.reduce((acc, assignment) => {
        if (!acc[assignment.subject]) {
            acc[assignment.subject] = [];
        }
        acc[assignment.subject].push(assignment);
        return acc;
    }, {});

    // Define quest order and icons - UPDATED WITH HOME
    const questInfo = {
        'Life OS Implementation': { icon: '🏗️', color: '#3b82f6' },
        'The Clarity Engine': { icon: '📚', color: '#8b5cf6' },
        'My First Automation App': { icon: '💡', color: '#10b981' },
        'Home': { icon: '🏠', color: '#f59e0b' }
    };

    // Build HTML for each group
    let html = '';
    
    // First show defined quests in order
    Object.keys(questInfo).forEach(subject => {
        if (grouped[subject]) {
            html += createSubjectGroup(subject, grouped[subject], questInfo[subject]);
            delete grouped[subject];
        }
    });
    
    // Then show any other subjects (shouldn't happen with dropdown)
    Object.keys(grouped).forEach(subject => {
        html += createSubjectGroup(subject, grouped[subject], { icon: '📌', color: '#6b7280' });
    });

    return html;
}

function createSubjectGroup(subject, assignments, info) {
    const completed = assignments.filter(a => a.status === 'completed').length;
    const total = assignments.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    return `
        <div class="subject-group" style="border-color: ${info.color}">
            <div class="subject-header" style="background: ${info.color}15">
                <div class="subject-title">
                    <span class="subject-icon">${info.icon}</span>
                    <h2>${subject}</h2>
                    <span class="subject-count">${completed}/${total} completed</span>
                </div>
                <div class="subject-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${info.color}"></div>
                    </div>
                </div>
            </div>
            <div class="subject-assignments">
                ${assignments.map(assignment => createAssignmentCard(assignment)).join('')}
            </div>
        </div>
    `;
}

function createAssignmentCard(assignment) {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && assignment.status !== 'completed';
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    return `
        <div class="assignment-card ${assignment.priority} ${isOverdue ? 'overdue' : ''} ${assignment.status === 'completed' ? 'completed' : ''}">
            <div class="card-header">
                <h3>${assignment.title}</h3>
                ${viewMode === 'list' ? `<span class="subject-tag">${assignment.subject}</span>` : ''}
            </div>
            <p class="description">${assignment.description || 'No description'}</p>
            <div class="card-meta">
                <span class="due-date">📅 ${formatDate(dueDate)}</span>
                <span class="days-left ${isOverdue ? 'overdue-text' : ''}">
                    ${assignment.status === 'completed' ? '✅ Completed' : 
                      isOverdue ? '⚠️ Overdue' : 
                      `${daysLeft} days left`}
                </span>
            </div>
            <div class="card-footer">
                <div class="time-info">
                    <span>⏱️ ${assignment.estimatedHours}h estimated</span>
                    ${assignment.actualHours > 0 ? `<span>✓ ${assignment.actualHours}h actual</span>` : ''}
                </div>
            </div>
            <div class="card-actions">
                <select onchange="updateStatus('${assignment.id}', this.value)" ${assignment.status === 'completed' ? 'disabled' : ''}>
                    <option value="not_started" ${assignment.status === 'not_started' ? 'selected' : ''}>Not Started</option>
                    <option value="in_progress" ${assignment.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${assignment.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button onclick="deleteAssignment('${assignment.id}')" class="btn-delete">Delete</button>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${getProgress(assignment)}%"></div>
            </div>
        </div>
    `;
}

// Helper Functions
function filterAssignments() {
    return assignments.filter(assignment => {
        const matchSubject = !currentFilter.subject || assignment.subject === currentFilter.subject;
        const matchStatus = !currentFilter.status || assignment.status === currentFilter.status;
        return matchSubject && matchStatus;
    });
}

function sortAssignments(assignments) {
    return [...assignments].sort((a, b) => {
        switch (currentSort) {
            case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });
}

function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const weekCount = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= today && dueDate <= weekFromNow && a.status !== 'completed';
    }).length;
    
    const overdueCount = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate < today && a.status !== 'completed';
    }).length;
    
    const completedCount = assignments.filter(a => a.status === 'completed').length;
    const totalCount = assignments.length;
    
    document.getElementById('weekCount').textContent = weekCount;
    document.getElementById('overdueCount').textContent = overdueCount;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('totalCount').textContent = totalCount;
}

function populateSubjectFilter() {
    const subjects = [...new Set(assignments.map(a => a.subject))];
    const filterEl = document.getElementById('filterSubject');
    const currentValue = filterEl.value;
    filterEl.innerHTML = '<option value="">All Subjects</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    filterEl.value = currentValue;
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getProgress(assignment) {
    if (assignment.status === 'completed') return 100;
    if (assignment.status === 'not_started') return 0;
    return 50; // For in_progress
}

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