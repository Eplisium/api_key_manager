import { selectedProject, setSelectedProject, isProjectEditMode, setIsProjectEditMode, projectToDelete, setProjectToDelete } from '../state/state.js';
import { showNotification } from '../ui/notifications.js';
import { hideProjectModal, hideDeleteProjectModal } from '../ui/modals.js';
import { fetchKeys } from '../keys/keyManager.js';
import { handleProjectDragStart, handleProjectDragOver, handleProjectDragEnd, handleProjectDrop } from './projectDragDrop.js';

/**
 * Fetch all projects from the server
 * @returns {Promise<Array>} - The projects
 */
export async function fetchProjects() {
    try {
        const response = await fetch('/projects');
        const projects = await response.json();
        renderProjects(projects);
        updateProjectSelect(projects);
        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        showNotification('Failed to load projects', 'error');
        return [];
    }
}

/**
 * Render projects in the sidebar
 * @param {Array} projects - The projects to render
 */
export function renderProjects(projects) {
    // Sort projects by position to ensure correct order
    projects.sort((a, b) => a.position - b.position);
    
    const container = document.getElementById('projects-list');
    container.innerHTML = projects.map(project => `
        <div class="project-item ${selectedProject === project.id ? 'active' : ''}" 
                data-project-id="${project.id}"
                data-position="${project.position}"
                draggable="true"
                onclick="selectProject(${project.id})"
                oncontextmenu="showContextMenu(event, ${project.id})">
            <div class="project-info">
                <span class="project-name">${project.name}</span>
                <div class="project-tooltip">${project.name}</div>
            </div>
            <div class="project-actions">
                <button class="btn-icon" onclick="editProject(${project.id}, event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button class="btn-icon destructive" onclick="deleteProject(${project.id}, event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    // Add drag and drop event listeners to all project items
    document.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('dragstart', (e) => handleProjectDragStart(e, parseInt(item.dataset.projectId)));
        item.addEventListener('dragover', handleProjectDragOver);
        item.addEventListener('drop', handleProjectDrop);
        item.addEventListener('dragend', handleProjectDragEnd);
    });
}

/**
 * Update the project select dropdown
 * @param {Array} projects - The projects to include in the dropdown
 */
export function updateProjectSelect(projects) {
    const select = document.getElementById('project');
    select.innerHTML = '<option value="">No Project</option>' + 
        projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
}

/**
 * Select a project to view its keys
 * @param {number} projectId - The ID of the project to select
 */
export async function selectProject(projectId) {
    setSelectedProject(projectId);
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.projectId == projectId) {
            item.classList.add('active');
            // Update header display
            const projectName = item.querySelector('.project-name').textContent;
            document.getElementById('selected-project-name').textContent = projectName;
        }
    });
    
    if (!projectId) {
        document.getElementById('selected-project-name').textContent = 'All Projects';
    }
    
    // Show/hide import button based on project selection
    document.getElementById('import-env-btn').style.display = projectId ? 'inline-flex' : 'none';
    await fetchKeys();
}

/**
 * Show all keys (no project filter)
 */
export function showAllKeys() {
    setSelectedProject(null);
    localStorage.removeItem('selectedProject');
    document.getElementById('selected-project-name').textContent = 'All Projects';
    document.querySelectorAll('.project-item').forEach(item => item.classList.remove('active'));
    // Add this line to hide the import button
    document.getElementById('import-env-btn').style.display = 'none';
    fetchKeys();
}

/**
 * Edit a project
 * @param {number} projectId - The ID of the project to edit
 * @param {Event} event - The click event (optional)
 */
export async function editProject(projectId, event) {
    if (event) {
        event.stopPropagation();
    }
    try {
        const projects = await (await fetch('/projects')).json();
        const project = projects.find(p => p.id === projectId);
        if (!project) throw new Error('Project not found');

        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        
        setIsProjectEditMode(true);
        document.getElementById('project-modal-title').textContent = 'Edit Project';
        document.getElementById('project-modal').classList.add('show');
    } catch (error) {
        console.error('Error fetching project:', error);
        showNotification('Failed to load project details', 'error');
    }
}

/**
 * Delete a project
 * @param {number} projectId - The ID of the project to delete
 * @param {Event} event - The click event (optional)
 */
export async function deleteProject(projectId, event) {
    if (event) {
        event.stopPropagation();
    }
    setProjectToDelete(projectId);
    const projectName = document.querySelector(`.project-item[data-project-id="${projectId}"] .project-name`).textContent;
    
    // Update the modal message with project name
    document.querySelector('.delete-project-message').textContent = 
        `What would you like to do with "${projectName}" and its associated keys?`;
    
    document.getElementById('delete-project-modal').classList.add('show');
}

/**
 * Execute project deletion
 * @param {boolean} deleteKeys - Whether to delete the project's keys
 */
export async function executeProjectDelete(deleteKeys) {
    try {
        const response = await fetch(`/projects/${projectToDelete}?delete_keys=${deleteKeys}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete project');
        }

        const responseData = await response.json();
        
        // Show a notification with what happened
        showNotification(`Project deleted. ${responseData.keys_affected} keys ${responseData.action}`, 'success');

        if (selectedProject === projectToDelete) {
            showAllKeys();
        }
        fetchProjects();
        hideDeleteProjectModal();
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification(error.message, 'error');
        hideDeleteProjectModal();
    }
}

/**
 * Handle project form submission
 * @param {Event} event - The form submit event
 */
export async function handleProjectSubmit(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('project-name').value
    };
    const projectId = document.getElementById('project-id').value;

    try {
        const url = isProjectEditMode ? `/projects/${projectId}` : '/projects';
        const method = isProjectEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save project');
        }

        showNotification(isProjectEditMode ? 'Project updated successfully' : 'Project created successfully', 'success');
        hideProjectModal();
        fetchProjects();
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification(error.message, 'error');
    }
}
