let isEditMode = false;
let selectedProject = null;
let isProjectEditMode = false;
let draggedKey = null;
let draggedKeyRect = null;
let draggedProject = null;
let projectToDelete = null;

// Add these new functions for context menu
let activeProjectId = null;

function showContextMenu(event, projectId) {
    event.preventDefault();
    event.stopPropagation();
    
    const contextMenu = document.getElementById('project-context-menu');
    const projectItem = event.currentTarget;
    const projectName = projectItem.querySelector('.project-name').textContent;
    activeProjectId = projectId;
    
    // If sidebar is collapsed, show project name in context menu
    if (document.getElementById('sidebar').classList.contains('collapsed')) {
        // Hide tooltip
        const tooltip = projectItem.querySelector('.project-tooltip');
        if (tooltip) tooltip.style.display = 'none';
        
        // Add project name to context menu if not already present
        let projectNameDisplay = contextMenu.querySelector('.project-context-name');
        if (!projectNameDisplay) {
            projectNameDisplay = document.createElement('div');
            projectNameDisplay.className = 'project-context-name';
            contextMenu.insertBefore(projectNameDisplay, contextMenu.firstChild);
        }
        projectNameDisplay.textContent = projectName;
    }
    
    // Position the menu at cursor
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.classList.add('show');
    
    // Add click listener to close menu when clicking outside
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('contextmenu', hideContextMenu);
}

function hideContextMenu() {
    const contextMenu = document.getElementById('project-context-menu');
    contextMenu.classList.remove('show');
    activeProjectId = null;
    
    // Remove project name from context menu
    const projectNameDisplay = contextMenu.querySelector('.project-context-name');
    if (projectNameDisplay) {
        projectNameDisplay.remove();
    }
    
    // Show all tooltips again
    document.querySelectorAll('.project-tooltip').forEach(tooltip => {
        tooltip.style.display = '';
    });
    
    // Remove click listeners
    document.removeEventListener('click', hideContextMenu);
    document.removeEventListener('contextmenu', hideContextMenu);
}

function editProjectFromMenu(event) {
    event.preventDefault();
    if (activeProjectId !== null) {
        editProject(activeProjectId);
    }
    hideContextMenu();
}

function deleteProjectFromMenu(event) {
    event.preventDefault();
    if (activeProjectId !== null) {
        deleteProject(activeProjectId);
    }
    hideContextMenu();
}

// Add these new functions for key context menu
let activeKeyValue = null;

function showKeyContextMenu(event, keyValue) {
    event.preventDefault();
    event.stopPropagation();
    
    const contextMenu = document.getElementById('key-context-menu');
    activeKeyValue = keyValue;
    
    // Update the key value display
    const keyDisplay = contextMenu.querySelector('.key-context-value');
    keyDisplay.textContent = keyValue;
    
    // Position the menu at cursor
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.classList.add('show');
    
    // Add click listener to close menu when clicking outside
    document.addEventListener('click', hideKeyContextMenu);
    document.addEventListener('contextmenu', hideKeyContextMenu);
}

function hideKeyContextMenu() {
    const contextMenu = document.getElementById('key-context-menu');
    contextMenu.classList.remove('show');
    activeKeyValue = null;
    
    // Remove click listeners
    document.removeEventListener('click', hideKeyContextMenu);
    document.removeEventListener('contextmenu', hideKeyContextMenu);
}

function copyKeyFromMenu(event) {
    event.preventDefault();
    if (activeKeyValue !== null) {
        copyToClipboard(activeKeyValue);
    }
    hideKeyContextMenu();
}

async function fetchProjects() {
    try {
        const response = await fetch('/projects');
        const projects = await response.json();
        renderProjects(projects);
        updateProjectSelect(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projects-list');
    container.innerHTML = projects.map(project => `
        <div class="project-item ${selectedProject === project.id ? 'active' : ''}" 
                data-project-id="${project.id}"
                data-position="${project.position}"
                draggable="true"
                ondragstart="handleProjectDragStart(event, ${project.id})"
                ondragover="handleProjectDragOver(event)"
                ondrop="handleProjectDrop(event)"
                ondragend="handleProjectDragEnd(event)"
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
}

function updateProjectSelect(projects) {
    const select = document.getElementById('project');
    select.innerHTML = '<option value="">No Project</option>' + 
        projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
}

async function fetchKeys() {
    try {
        console.log('Fetching keys...');
        let url = '/keys';
        if (selectedProject !== null) {
            url += `?project_id=${selectedProject}`;
        } else {
            url += '?show_all=true';
        }
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch keys');
        }
        const keys = await response.json();
        console.log('Received keys:', keys);
        if (!Array.isArray(keys)) {
            console.error('Expected array of keys but got:', typeof keys, keys);
            throw new Error('Invalid response format');
        }
        console.log('Filtered keys:', keys);
        renderKeys(keys);
    } catch (error) {
        console.error('Error fetching keys:', error);
        const container = document.getElementById('keys-container');
        container.innerHTML = 
            '<div class="error-message">' +
            'Failed to load keys. Please try refreshing the page.<br>' +
            'Error: ' + error.message +
            '</div>';
    }
}

function renderKeys(keys) {
    console.log('Rendering keys:', keys);
    const container = document.getElementById('keys-container');
    container.innerHTML = keys.map(key => `
        <div class="key-card" 
                data-key-id="${key.id}" 
                draggable="true" 
                ondragstart="handleDragStart(event, ${key.id})"
                ondragend="handleDragEnd(event)"
                oncontextmenu="showKeyContextMenu(event, '${key.key.replace(/'/g, "\\'")}')">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-semibold">${key.name}</h3>
                    <div class="text-xs text-gray-500 mb-1">Project: ${key.project ? key.project.name : 'None'}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="copyToClipboard('${key.key.replace(/'/g, "\\'")}')" class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        <span>Copy</span>
                    </button>
                    <button onclick="editKey(${key.id})" class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        <span>Edit</span>
                    </button>
                    <button onclick="deleteKey(${key.id})" class="btn-icon destructive">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">${key.description || ''}</div>
            <div class="text-sm text-gray-500">Used with: ${key.used_with || 'N/A'}</div>
        </div>
    `).join('');
    
    container.ondragover = handleDragOver;
    container.ondrop = handleDrop;
}

function showAllKeys() {
    selectedProject = null;
    localStorage.removeItem('selectedProject');
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('active');
    });
    // Hide import button when showing all keys
    document.getElementById('import-env-btn').style.display = 'none';
    fetchKeys();
}

// Modal operations
function showProjectModal() {
    isProjectEditMode = false;
    document.getElementById('project-form').reset();
    document.getElementById('project-modal-title').textContent = 'New Project';
    document.getElementById('project-modal').classList.add('show');
}

function hideProjectModal() {
    document.getElementById('project-modal').classList.remove('show');
}

function showAddModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'Add New Key';
    document.getElementById('key-form').reset();
    document.getElementById('key-id').value = '';
    document.getElementById('key-modal').classList.add('show');
}

function hideModal() {
    document.getElementById('key-modal').classList.remove('show');
}

// Form submissions
async function handleFormSubmit(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        key: document.getElementById('key').value,
        description: document.getElementById('description').value,
        used_with: document.getElementById('used-with').value,
        project_id: document.getElementById('project').value || null
    };

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode 
        ? `/keys/${document.getElementById('key-id').value}`
        : '/keys';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save key');
        }

        showNotification(isEditMode ? 'Key updated successfully' : 'Key added successfully', 'success');
        hideModal();
        fetchKeys();
    } catch (error) {
        console.error('Error saving key:', error);
        showNotification(error.message, 'error');
    }
}

async function editProject(projectId, event) {
    if (event) {
        event.stopPropagation();
    }
    try {
        const projects = await (await fetch('/projects')).json();
        const project = projects.find(p => p.id === projectId);
        if (!project) throw new Error('Project not found');

        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        
        isProjectEditMode = true;
        document.getElementById('project-modal-title').textContent = 'Edit Project';
        document.getElementById('project-modal').classList.add('show');
    } catch (error) {
        console.error('Error fetching project:', error);
        showNotification('Failed to load project details', 'error');
    }
}

async function handleProjectSubmit(event) {
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

function handleDragStart(event, keyId) {
    draggedKey = keyId;
    const keyCard = event.target;
    draggedKeyRect = keyCard.getBoundingClientRect();
    keyCard.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', keyId);
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    draggedKey = null;
    draggedKeyRect = null;
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // If we're dragging over a project item, just return
    if (event.currentTarget.classList.contains('project-item')) {
        event.currentTarget.classList.add('drag-over');
        return;
    }
    
    const container = document.getElementById('keys-container');
    const cards = Array.from(container.getElementsByClassName('key-card'));
    const draggedElement = document.querySelector('.dragging');
    
    if (!draggedElement) return;
    
    // Only allow reordering within the same project view
    if (selectedProject !== null) {
        const closestCard = findClosestCard(event.clientY, cards.filter(card => !card.classList.contains('dragging')));
        
        if (closestCard) {
            const rect = closestCard.getBoundingClientRect();
            const threshold = rect.top + rect.height / 2;
            
            if (event.clientY < threshold) {
                container.insertBefore(draggedElement, closestCard);
            } else {
                container.insertBefore(draggedElement, closestCard.nextSibling);
            }
        }
    }
}

function findClosestCard(mouseY, cards) {
    return cards.reduce((closest, card) => {
        const rect = card.getBoundingClientRect();
        const offset = mouseY - rect.top - rect.height / 2;
        
        if (closest === null || Math.abs(offset) < Math.abs(closest.offset)) {
            return { element: card, offset: offset };
        } else {
            return closest;
        }
    }, null)?.element;
}

async function handleDrop(event, projectId = null) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const keyId = parseInt(event.dataTransfer.getData('text/plain'));
    const container = document.getElementById('keys-container');
    const cards = Array.from(container.getElementsByClassName('key-card'));
    const droppedCard = document.querySelector(`[data-key-id="${keyId}"]`);
    
    try {
        let newPosition = 0;
        
        // If dropping on a project item
        if (projectId !== null) {
            // Move to end of target project
            newPosition = -1;  // Special value to indicate "move to end"
        } else {
            // Reordering within current view
            if (!droppedCard || !selectedProject) return;
            newPosition = cards.indexOf(droppedCard);
            projectId = selectedProject;
        }
        
        const response = await fetch(`/keys/${keyId}/reorder`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_position: newPosition,
                project_id: projectId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder key');
        }
        
        // If we moved to a different project, switch to that project view
        if (projectId !== selectedProject) {
            selectProject(projectId);  // This will handle localStorage and UI updates
        }
        
        // Refresh the keys to ensure correct order
        await fetchKeys();
    } catch (error) {
        console.error('Error reordering key:', error);
        // Revert the UI to the original state
        await fetchKeys();
    }
}

async function selectProject(projectId) {
    selectedProject = projectId;
    localStorage.setItem('selectedProject', projectId);
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.projectId == projectId) {
            item.classList.add('active');
        }
    });
    // Show/hide import button based on project selection
    document.getElementById('import-env-btn').style.display = projectId ? 'inline-flex' : 'none';
    fetchKeys();
}

document.addEventListener('dragend', () => {
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('drag-over');
    });
});

async function editKey(keyId, event) {
    if (event) {
        event.stopPropagation();
    }
    try {
        const response = await fetch(`/keys/${keyId}`);
        if (!response.ok) {
            throw new Error('Failed to load key details');
        }
        const key = await response.json();
        
        document.getElementById('key-id').value = key.id;
        document.getElementById('name').value = key.name;
        document.getElementById('key').value = key.key;
        document.getElementById('description').value = key.description || '';
        document.getElementById('used-with').value = key.used_with || '';
        document.getElementById('project').value = key.project ? key.project.id : '';
        
        isEditMode = true;
        document.getElementById('modal-title').textContent = 'Edit Key';
        document.getElementById('key-modal').classList.add('show');
    } catch (error) {
        console.error('Error fetching key:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteKey(keyId, event) {
    if (event) {
        event.stopPropagation();
    }
    showDeleteKeyModal(keyId);
}

function showDeleteProjectModal(projectId) {
    projectToDelete = projectId;
    const projectName = document.querySelector(`.project-item[data-project-id="${projectId}"] .project-name`).textContent;
    
    // Update the modal message with project name
    document.querySelector('.delete-project-message').textContent = 
        `What would you like to do with "${projectName}" and its associated keys?`;
    
    document.getElementById('delete-project-modal').classList.add('show');
}

function hideDeleteProjectModal() {
    document.getElementById('delete-project-modal').classList.remove('show');
    projectToDelete = null;
}

async function executeProjectDelete(deleteKeys) {
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

async function deleteProject(projectId, event) {
    if (event) {
        event.stopPropagation();
    }
    showDeleteProjectModal(projectId);
}

function copyToClipboard(text, event) {
    if (event) {
        event.stopPropagation();
    }
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Key copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleButton = document.getElementById('toggle-sidebar');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    toggleButton.classList.toggle('rotated');
    
    // Save the state
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (theme === 'dark') {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    } else {
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
    }
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// Initialize sidebar state
const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
if (sidebarCollapsed) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleButton = document.getElementById('toggle-sidebar');
    
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    toggleButton.classList.add('rotated');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    await fetchProjects();
    
    // Restore rainbow state
    const titleRainbow = localStorage.getItem('titleRainbow') === 'true';
    if (titleRainbow) {
        document.querySelector('.title').classList.add('rainbow');
    }
    
    // Restore selected project from localStorage
    const savedProject = localStorage.getItem('selectedProject');
    if (savedProject) {
        selectedProject = parseInt(savedProject);
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.toggle('active', item.dataset.projectId == selectedProject);
        });
        // Show import button if a project is selected
        document.getElementById('import-env-btn').style.display = 'inline-flex';
    } else {
        // Hide import button if no project is selected
        document.getElementById('import-env-btn').style.display = 'none';
    }
    
    await fetchKeys();
});

async function handleEnvFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }

    const allowedExtensions = ['.env', '.json', '.yaml', '.yml', '.properties', '.conf', '.config'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        showNotification(`Invalid file type. Supported formats: ${allowedExtensions.join(', ')}`, 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`/projects/${selectedProject}/import-env`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showPostImportModal(result.keys);
            showNotification('File imported successfully', 'success');
        } else {
            throw new Error(result.error || 'Failed to import file');
        }
    } catch (error) {
        console.error('Error importing file:', error);
        showNotification('Failed to import file', 'error');
    }

    // Clear the file input
    event.target.value = '';
}

function showPostImportModal(keys) {
    const container = document.getElementById('imported-keys-list');
    document.getElementById('import-count').textContent = `${keys.length} key${keys.length !== 1 ? 's' : ''} imported`;
    
    container.innerHTML = keys.map((key, index) => `
        <div class="imported-key-item" data-key-id="${key.id}">
            <div class="key-select">
                <input type="checkbox" class="key-checkbox" checked>
            </div>
            <div class="key-number">${index + 1}</div>
            <div class="key-content">
                <div class="key-header">
                    <div class="key-title">
                        <strong class="key-name">${key.name}</strong>
                        <div class="key-value" onclick="copyToClipboard('${key.key}')">
                            <span class="text-sm text-gray-500">${key.key}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </div>
                    </div>
                </div>
                <div class="key-config">
                    <div class="input-group">
                        <label class="input-label">Description</label>
                        <textarea class="input-field description-field" rows="2" placeholder="Add a description for this key...">${key.description || ''}</textarea>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Used with</label>
                        <input type="text" class="input-field used-with-field" placeholder="e.g., AWS, Google Cloud..." value="${key.used_with || ''}">
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('post-import-modal').classList.add('show');
}

function hidePostImportModal() {
    document.getElementById('post-import-modal').classList.remove('show');
    fetchKeys(); // Refresh the keys list
}

function applyBulkUsedWith() {
    const bulkValue = document.getElementById('bulk-used-with').value.trim();
    if (!bulkValue) {
        showNotification('Please enter a value to apply', 'error');
        return;
    }
    
    const fields = document.querySelectorAll('.used-with-field');
    fields.forEach(field => {
        field.value = bulkValue;
        // Add a brief highlight effect to show the change
        field.style.backgroundColor = 'var(--hover)';
        setTimeout(() => {
            field.style.backgroundColor = '';
        }, 300);
    });

    showNotification(`Applied "${bulkValue}" to ${fields.length} keys`, 'success');
}

function applyBulkDescription() {
    const bulkValue = document.getElementById('bulk-description').value.trim();
    if (!bulkValue) {
        showNotification('Please enter a description to apply', 'error');
        return;
    }
    
    const fields = document.querySelectorAll('.description-field');
    fields.forEach(field => {
        field.value = bulkValue;
        // Add a brief highlight effect to show the change
        field.style.backgroundColor = 'var(--hover)';
        setTimeout(() => {
            field.style.backgroundColor = '';
        }, 300);
    });

    // Show feedback
    showNotification(`Applied description to ${fields.length} keys`, 'success');
}

function clearAllDescriptions() {
    const fields = document.querySelectorAll('.description-field');
    fields.forEach(field => {
        field.value = '';
        // Add a brief highlight effect to show the change
        field.style.backgroundColor = 'var(--hover)';
        setTimeout(() => {
            field.style.backgroundColor = '';
        }, 300);
    });

    // Show feedback
    showNotification(`Cleared descriptions for ${fields.length} keys`, 'success');
}

let allKeysSelected = true;

function toggleAllKeys() {
    allKeysSelected = !allKeysSelected;
    const checkboxes = document.querySelectorAll('.key-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = allKeysSelected;
    });
    document.getElementById('select-all-text').textContent = allKeysSelected ? 'Deselect All' : 'Select All';
}

async function removeUnselectedKeys() {
    const keyItems = document.querySelectorAll('.imported-key-item');
    const deletions = [];
    
    keyItems.forEach(item => {
        const checkbox = item.querySelector('.key-checkbox');
        if (!checkbox.checked) {
            const keyId = item.dataset.keyId;
            deletions.push(
                fetch(`/keys/${keyId}`, { method: 'DELETE' })
                    .then(() => item.remove())
            );
        }
    });

    try {
        await Promise.all(deletions);
        
        // Update the import count
        const remainingKeys = document.querySelectorAll('.imported-key-item').length;
        document.getElementById('import-count').textContent = 
            `${remainingKeys} key${remainingKeys !== 1 ? 's' : ''} imported`;
        
        // Show feedback
        showNotification(`Removed ${deletions.length} key${deletions.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
        console.error('Error removing keys:', error);
        showNotification('Some keys failed to be removed. Please try again.', 'error');
    }
}

async function saveImportedKeysConfig() {
    const updates = [];
    document.querySelectorAll('.imported-key-item').forEach(item => {
        const checkbox = item.querySelector('.key-checkbox');
        if (checkbox.checked) {  // Only update selected keys
            const keyId = item.dataset.keyId;
            const description = item.querySelector('.description-field').value;
            const usedWith = item.querySelector('.used-with-field').value;
            
            updates.push(updateKey(keyId, { description, used_with: usedWith }));
        }
    });

    try {
        await Promise.all(updates);
        hidePostImportModal();
    } catch (error) {
        console.error('Error updating imported keys:', error);
        showNotification('Some keys failed to update. Please try again.', 'error');
    }
}

async function updateKey(keyId, data) {
    const response = await fetch(`/keys/${keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to update key ${keyId}`);
    }

    return response.json();
}

async function confirmClearAllKeys() {
    const projectName = selectedProject ? 
        document.querySelector(`.project-item[data-project-id="${selectedProject}"]`)?.querySelector('.project-name')?.textContent : 
        'all projects';
    
    const message = selectedProject ? 
        `Are you sure you want to delete ALL keys from "${projectName}"?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.` :
        `Are you sure you want to delete ALL keys from all projects?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.`;

    document.getElementById('clear-keys-message').innerHTML = message;
    document.getElementById('clear-keys-modal').classList.add('show');
}

function hideClearKeysModal() {
    document.getElementById('clear-keys-modal').classList.remove('show');
}

async function executeClearAllKeys() {
    try {
        const url = selectedProject ? `/projects/${selectedProject}/keys` : '/keys';
        const response = await fetch(url, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete keys');
        }

        const result = await response.json();
        const projectName = selectedProject ? 
            document.querySelector(`.project-item[data-project-id="${selectedProject}"]`)?.querySelector('.project-name')?.textContent : 
            'all projects';

        showNotification(`Deleted ${result.count} keys from ${projectName}`, 'success');

        // Refresh the keys list
        fetchKeys();
    } catch (error) {
        console.error('Error clearing keys:', error);
        showNotification('Failed to clear keys. Please try again.', 'error');
    } finally {
        hideClearKeysModal();
    }
}

function toggleExportDropdown() {
    document.getElementById("export-dropdown").classList.toggle("show");
}

function toggleImportDropdown() {
    document.getElementById("import-dropdown").classList.toggle("show");
}

// Close dropdowns when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.btn-secondary')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

async function importFromOS() {
    try {
        const response = await fetch(`/projects/${selectedProject}/import-os-env`, {
            method: 'POST'
        });

        const result = await response.json();
        if (response.ok) {
            showPostImportModal(result.keys);
            showNotification('Environment variables imported successfully', 'success');
        } else {
            throw new Error(result.error || 'Failed to import OS environment variables');
        }
    } catch (error) {
        console.error('Error importing OS environment variables:', error);
        showNotification(error.message, 'error');
    }

    document.getElementById("import-dropdown").classList.remove("show");
}

async function exportKeys(format) {
    try {
        let url = `/export?format=${format}`;
        if (selectedProject) {
            url += `&project_id=${selectedProject}`;
        }
        
        window.location.href = url;
        showNotification('Export started', 'success');
        
        document.getElementById("export-dropdown").classList.remove("show");
    } catch (error) {
        console.error('Error exporting keys:', error);
        showNotification('Failed to export keys. Please try again.', 'error');
    }
}

function handleProjectDragStart(event, projectId) {
    draggedProject = projectId;
    event.dataTransfer.setData('text/plain', projectId);
    event.currentTarget.classList.add('dragging');
}

function handleProjectDragOver(event) {
    event.preventDefault();
    const projectItem = event.currentTarget;
    if (projectItem.classList.contains('project-item')) {
        projectItem.classList.add('drag-over');
    }
}

function handleProjectDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

async function handleProjectDrop(event) {
    event.preventDefault();
    const projectItem = event.currentTarget;
    projectItem.classList.remove('drag-over');
    
    if (!draggedProject) return;
    
    const targetProjectId = parseInt(projectItem.dataset.projectId);
    const sourceProjectId = draggedProject;
    
    if (sourceProjectId === targetProjectId) return;
    
    try {
        const targetPosition = parseInt(projectItem.dataset.position);
        
        const response = await fetch(`/projects/${sourceProjectId}/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_position: targetPosition })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder project');
        }
        
        showNotification('Project order updated', 'success');
        await fetchProjects();
    } catch (error) {
        console.error('Error reordering project:', error);
        showNotification(error.message, 'error');
    } finally {
        draggedProject = null;
    }
}

// Update the title structure to support individual word coloring
document.querySelector('.title').innerHTML = '<span class="title-api">API</span> <span class="title-key">Key</span> <span class="title-manager">Manager</span>';

// Update click handlers for rainbow effect - only on "Key"
document.querySelector('.title-key').addEventListener('click', (event) => {
    if (event.shiftKey) {
        const title = document.querySelector('.title');
        title.classList.toggle('rainbow');
        
        // Remove any custom colors when rainbow is active
        if (title.classList.contains('rainbow')) {
            document.querySelectorAll('.title span').forEach(span => {
                span.style.color = '';
                // Clear saved colors when rainbow is enabled
                localStorage.removeItem(`titleColor_${span.className.split('-')[1]}`);
            });
        }
        
        // Save rainbow state
        localStorage.setItem('titleRainbow', title.classList.contains('rainbow'));
    }
});

// Add right-click handler for the "Key" text only
document.querySelector('.title-key').addEventListener('contextmenu', (event) => {
    if (event.shiftKey) {
        event.preventDefault();
        showColorPickerModal(event);
    }
});

// Initialize title state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Restore rainbow effect if it was active
    const wasRainbow = localStorage.getItem('titleRainbow') === 'true';
    if (wasRainbow) {
        const title = document.querySelector('.title');
        title.classList.add('rainbow');
        // Clear any saved colors
        document.querySelectorAll('.title span').forEach(span => {
            span.style.color = '';
            localStorage.removeItem(`titleColor_${span.className.split('-')[1]}`);
        });
    } else {
        // Restore individual word colors if rainbow was not active
        ['api', 'key', 'manager'].forEach(word => {
            const savedColor = localStorage.getItem(`titleColor_${word}`);
            if (savedColor) {
                document.querySelector(`.title-${word}`).style.color = savedColor;
            }
        });
    }
});

function resetTitleColor() {
    // Remove any custom colors and rainbow effect
    const title = document.querySelector('.title');
    title.classList.remove('rainbow');
    document.querySelectorAll('.title span').forEach(span => {
        span.style.color = '';
        localStorage.removeItem(`titleColor_${span.className.split('-')[1]}`);
    });
    localStorage.setItem('titleRainbow', 'false');

    // Reset color picker inputs to default color (#000000 for light mode, #FFFFFF for dark mode)
    const defaultColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#FFFFFF' : '#000000';
    document.getElementById('color-wheel').value = defaultColor;
    document.getElementById('hex-color').value = defaultColor.substring(1);
    const rgb = hexToRgb(defaultColor);
    document.getElementById('rgb-r').value = rgb.r;
    document.getElementById('rgb-g').value = rgb.g;
    document.getElementById('rgb-b').value = rgb.b;

    // Update preview
    document.querySelectorAll('.preview-text span').forEach(span => {
        span.style.color = defaultColor;
    });
}

let selectedWord = 'all';

function showColorPickerModal(event) {
    if (event) {
        event.preventDefault();
    }
    const modal = document.getElementById('color-picker-modal');
    modal.classList.add('show');
    
    // Initialize with current color or default
    const currentColor = localStorage.getItem('customTitleColor') || '#000000';
    initializeColorPicker(currentColor);

    // Reset word selection to 'all'
    selectedWord = 'all';
    document.querySelectorAll('.word-select-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.word === 'all');
    });
}

function hideColorPickerModal() {
    document.getElementById('color-picker-modal').classList.remove('show');
}

function initializeColorPicker(color) {
    // Remove rainbow effect if active
    document.querySelector('.title').classList.remove('rainbow');
    localStorage.setItem('titleRainbow', 'false');

    // Set initial values
    document.getElementById('color-wheel').value = color;
    document.getElementById('hex-color').value = color.substring(1);
    
    // Convert hex to RGB
    const rgb = hexToRgb(color);
    document.getElementById('rgb-r').value = rgb.r;
    document.getElementById('rgb-g').value = rgb.g;
    document.getElementById('rgb-b').value = rgb.b;

    // Update preview
    updatePreviewColors();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function updatePreviewColors() {
    const color = document.getElementById('color-wheel').value;
    if (selectedWord === 'all') {
        document.querySelectorAll('.preview-text span').forEach(span => {
            span.style.color = color;
        });
    } else {
        document.querySelector(`.preview-${selectedWord}`).style.color = color;
    }
}

function applyCustomColor() {
    const color = document.getElementById('color-wheel').value;
    const title = document.querySelector('.title');
    
    // Remove rainbow effect
    title.classList.remove('rainbow');
    localStorage.setItem('titleRainbow', 'false');

    if (selectedWord === 'all') {
        document.querySelectorAll('.title span').forEach(span => {
            span.style.color = color;
            localStorage.setItem(`titleColor_${span.className.split('-')[1]}`, color);
        });
    } else {
        const targetSpan = document.querySelector(`.title-${selectedWord}`);
        targetSpan.style.color = color;
        localStorage.setItem(`titleColor_${selectedWord}`, color);
    }

    hideColorPickerModal();
}

// Restore custom colors on page load
document.addEventListener('DOMContentLoaded', () => {
    ['api', 'key', 'manager'].forEach(word => {
        const savedColor = localStorage.getItem(`titleColor_${word}`);
        if (savedColor) {
            document.querySelector(`.title-${word}`).style.color = savedColor;
        }
    });
});

// Add event listeners for word selection buttons
document.querySelectorAll('.word-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.word-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedWord = btn.dataset.word;
        
        // Update preview with current colors
        updatePreviewColors();
    });
});

// Add event listeners for color inputs
document.getElementById('color-wheel').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('hex-color').value = color.substring(1);
    const rgb = hexToRgb(color);
    document.getElementById('rgb-r').value = rgb.r;
    document.getElementById('rgb-g').value = rgb.g;
    document.getElementById('rgb-b').value = rgb.b;
    updateColorPreview(color);
});

document.getElementById('hex-color').addEventListener('input', (e) => {
    let hex = e.target.value;
    if (hex.length === 6) {
        const color = '#' + hex;
        document.getElementById('color-wheel').value = color;
        const rgb = hexToRgb(color);
        document.getElementById('rgb-r').value = rgb.r;
        document.getElementById('rgb-g').value = rgb.g;
        document.getElementById('rgb-b').value = rgb.b;
        updateColorPreview(color);
    }
});

function handleRgbInput() {
    const r = document.getElementById('rgb-r').value;
    const g = document.getElementById('rgb-g').value;
    const b = document.getElementById('rgb-b').value;
    if (r && g && b) {
        const color = rgbToHex(Number(r), Number(g), Number(b));
        document.getElementById('color-wheel').value = color;
        document.getElementById('hex-color').value = color.substring(1);
        updateColorPreview(color);
    }
}

document.getElementById('rgb-r').addEventListener('input', handleRgbInput);
document.getElementById('rgb-g').addEventListener('input', handleRgbInput);
document.getElementById('rgb-b').addEventListener('input', handleRgbInput);

// Add right-click handler for the title
document.querySelector('.title').addEventListener('contextmenu', (event) => {
    if (event.shiftKey) {
        event.preventDefault();
        showColorPickerModal(event);
    }
});

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    // Position the tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 8}px`;
    tooltip.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.classList.add('show'), 10);
    
    return tooltip;
}

function hideTooltip(tooltip) {
    if (tooltip) {
        tooltip.classList.remove('show');
        setTimeout(() => tooltip.remove(), 200);
    }
}

function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add appropriate icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } else if (type === 'error') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        // Add copy icon for error messages
        icon += '<svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px; cursor: pointer;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
    }
    
    notification.innerHTML = `${icon}${message}`;
    
    // Add click handler for error messages
    if (type === 'error') {
        notification.style.cursor = 'pointer';
        notification.title = 'Click to copy error message';
        notification.addEventListener('click', () => {
            navigator.clipboard.writeText(message).then(() => {
                // Show a mini notification that the error was copied
                showNotification('Error message copied to clipboard', 'success');
            }).catch(err => {
                console.error('Failed to copy error message:', err);
            });
        });
    }
    
    document.body.appendChild(notification);
    
    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

let keyToDelete = null;

// Update handleFormSubmit for key saving
async function handleFormSubmit(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        key: document.getElementById('key').value,
        description: document.getElementById('description').value,
        used_with: document.getElementById('used-with').value,
        project_id: document.getElementById('project').value || null
    };

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode 
        ? `/keys/${document.getElementById('key-id').value}`
        : '/keys';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save key');
        }

        showNotification(isEditMode ? 'Key updated successfully' : 'Key added successfully', 'success');
        hideModal();
        fetchKeys();
    } catch (error) {
        console.error('Error saving key:', error);
        showNotification(error.message, 'error');
    }
}

// Update handleProjectSubmit for project saving
async function handleProjectSubmit(event) {
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

// Update deleteKey to show confirmation modal
function showDeleteKeyModal(keyId) {
    keyToDelete = keyId;
    document.getElementById('delete-key-modal').classList.add('show');
}

function hideDeleteKeyModal() {
    document.getElementById('delete-key-modal').classList.remove('show');
    keyToDelete = null;
}

async function executeKeyDelete() {
    try {
        const response = await fetch(`/keys/${keyToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete key');
        }

        showNotification('Key deleted successfully', 'success');
        fetchKeys();
    } catch (error) {
        console.error('Error deleting key:', error);
        showNotification(error.message, 'error');
    } finally {
        hideDeleteKeyModal();
    }
}

// Update deleteKey function to use modal
async function deleteKey(keyId, event) {
    if (event) {
        event.stopPropagation();
    }
    showDeleteKeyModal(keyId);
}

// Update error handling in editKey
async function editKey(keyId, event) {
    if (event) {
        event.stopPropagation();
    }
    try {
        const response = await fetch(`/keys/${keyId}`);
        if (!response.ok) {
            throw new Error('Failed to load key details');
        }
        const key = await response.json();
        
        document.getElementById('key-id').value = key.id;
        document.getElementById('name').value = key.name;
        document.getElementById('key').value = key.key;
        document.getElementById('description').value = key.description || '';
        document.getElementById('used-with').value = key.used_with || '';
        document.getElementById('project').value = key.project ? key.project.id : '';
        
        isEditMode = true;
        document.getElementById('modal-title').textContent = 'Edit Key';
        document.getElementById('key-modal').classList.add('show');
    } catch (error) {
        console.error('Error fetching key:', error);
        showNotification(error.message, 'error');
    }
}

// Update error handling in importFromOS
async function importFromOS() {
    try {
        const response = await fetch(`/projects/${selectedProject}/import-os-env`, {
            method: 'POST'
        });

        const result = await response.json();
        if (response.ok) {
            showPostImportModal(result.keys);
            showNotification('Environment variables imported successfully', 'success');
        } else {
            throw new Error(result.error || 'Failed to import OS environment variables');
        }
    } catch (error) {
        console.error('Error importing OS environment variables:', error);
        showNotification(error.message, 'error');
    }

    document.getElementById("import-dropdown").classList.remove("show");
}

// Update error handling in exportKeys
async function exportKeys(format) {
    try {
        let url = `/export?format=${format}`;
        if (selectedProject) {
            url += `&project_id=${selectedProject}`;
        }
        
        window.location.href = url;
        showNotification('Export started', 'success');
        
        document.getElementById("export-dropdown").classList.remove("show");
    } catch (error) {
        console.error('Error exporting keys:', error);
        showNotification('Failed to export keys. Please try again.', 'error');
    }
}

// Update error handling in handleProjectDrop
async function handleProjectDrop(event) {
    event.preventDefault();
    const projectItem = event.currentTarget;
    projectItem.classList.remove('drag-over');
    
    if (!draggedProject) return;
    
    const targetProjectId = parseInt(projectItem.dataset.projectId);
    const sourceProjectId = draggedProject;
    
    if (sourceProjectId === targetProjectId) return;
    
    try {
        const targetPosition = parseInt(projectItem.dataset.position);
        
        const response = await fetch(`/projects/${sourceProjectId}/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_position: targetPosition })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder project');
        }
        
        showNotification('Project order updated', 'success');
        await fetchProjects();
    } catch (error) {
        console.error('Error reordering project:', error);
        showNotification(error.message, 'error');
    } finally {
        draggedProject = null;
    }
}

function downloadDatabase() {
    const button = document.querySelector('.download-db-btn');
    const originalContent = button.innerHTML;
    
    // Disable button and show loading state
    button.disabled = true;
    button.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Downloading...
    `;

    fetch('/download-db')
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to download database');
                });
            }
            return response.blob();
        })
        .then(blob => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(/[/:]/g, '').replace(', ', '_').replace(' ', '').toLowerCase();
            
            a.href = url;
            a.download = `keys_${timestamp}.db`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Database downloaded successfully', 'success');
        })
        .catch(error => {
            console.error('Error downloading database:', error);
            showNotification(error.message, 'error');
        })
        .finally(() => {
            // Reset button state
            button.disabled = false;
            button.innerHTML = originalContent;
        });
}

function toggleManageDBDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('manage-db-dropdown');
    const button = document.querySelector('.download-db-btn');
    const sidebar = document.getElementById('sidebar');
    
    // Toggle dropdown visibility
    dropdown.classList.toggle('show');
    
    if (dropdown.classList.contains('show')) {
        // Get button and viewport dimensions
        const buttonRect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Reset any existing positioning
        dropdown.style.left = '';
        dropdown.style.right = '';
        dropdown.style.top = '';
        dropdown.style.bottom = '';
        dropdown.style.transform = '';
        
        if (sidebar.classList.contains('collapsed')) {
            // For collapsed sidebar
            const spaceOnRight = viewportWidth - buttonRect.right;
            const spaceOnLeft = buttonRect.left;
            
            if (spaceOnRight >= 240) { // Show on right if there's enough space
                dropdown.style.left = `${buttonRect.right + 4}px`;
                dropdown.style.top = `${Math.min(buttonRect.top, viewportHeight - 300)}px`;
            } else if (spaceOnLeft >= 240) { // Show on left if there's enough space
                dropdown.style.right = `${viewportWidth - buttonRect.left + 4}px`;
                dropdown.style.top = `${Math.min(buttonRect.top, viewportHeight - 300)}px`;
            } else { // Center on screen if no space on either side
                dropdown.style.left = '50%';
                dropdown.style.top = '50%';
                dropdown.style.transform = 'translate(-50%, -50%)';
            }
        } else {
            // For expanded sidebar, let CSS handle the positioning
            // Just check if we need to flip it above the button
            const dropdownHeight = dropdown.offsetHeight;
            const spaceBelow = viewportHeight - buttonRect.bottom;
            
            if (spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight) {
                // If not enough space below but enough space above, show above
                dropdown.style.bottom = '100%';
                dropdown.style.top = 'auto';
                dropdown.style.marginTop = '0';
                dropdown.style.marginBottom = '4px';
            }
        }
        
        // Add click listener to close dropdown when clicking outside
        function closeDropdown(e) {
            if (!e.target.closest('.download-db-btn') && !e.target.closest('.manage-db-dropdown')) {
                dropdown.classList.remove('show');
                // Reset positioning styles
                dropdown.style.left = '';
                dropdown.style.right = '';
                dropdown.style.top = '';
                dropdown.style.bottom = '';
                dropdown.style.transform = '';
                dropdown.style.marginTop = '';
                dropdown.style.marginBottom = '';
                document.removeEventListener('click', closeDropdown);
            }
        }
        
        // Remove existing listener before adding a new one
        document.removeEventListener('click', closeDropdown);
        
        // Add the click listener on the next tick to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 0);
    }
}

function showImportDBModal() {
    const modal = document.getElementById('import-db-modal');
    modal.classList.add('show');
    document.getElementById('manage-db-dropdown').classList.remove('show');
}

function hideImportDBModal() {
    const modal = document.getElementById('import-db-modal');
    modal.classList.remove('show');
    document.getElementById('db-file').value = '';  // Reset file input
}

async function handleDBImport(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('db-file');
    const file = fileInput.files[0];
    const importMode = document.querySelector('input[name="import-mode"]:checked').value;
    
    if (!file) {
        showNotification('Please select a database file', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('import_mode', importMode);
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Importing...';
        
        const response = await fetch('/import-db', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message, 'success');
            hideImportDBModal();
            
            // Reload the page after a short delay to show the imported data
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to import database');
        }
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        // Reset loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Import';
    }
}

// Encryption Functions
function showEncryptionModal(mode) {
    const modal = document.getElementById('encryption-modal');
    const title = document.getElementById('encryption-modal-title');
    const submitBtn = document.getElementById('encryption-submit-btn');
    const modeInput = document.getElementById('encryption-mode');
    const icon = document.getElementById('encryption-modal-icon');
    
    // Reset form
    document.getElementById('encryption-form').reset();
    
    // Set mode
    modeInput.value = mode;
    
    // Update UI based on mode
    if (mode === 'encrypt') {
        title.textContent = 'Encrypt Keys';
        submitBtn.textContent = 'Encrypt Keys';
        icon.innerHTML = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    } else {
        title.textContent = 'Decrypt Keys';
        submitBtn.textContent = 'Decrypt Keys';
        icon.innerHTML = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="m8 11-5 5"/><path d="m21 16-5-5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    }
    
    modal.style.display = 'flex';
}

function hideEncryptionModal() {
    document.getElementById('encryption-modal').style.display = 'none';
}

function showEncryptionStatus() {
    const modal = document.getElementById('encryption-status-modal');
    modal.style.display = 'flex';
    
    // Reset counters
    document.getElementById('total-keys').textContent = 'Loading...';
    document.getElementById('encrypted-keys').textContent = 'Loading...';
    document.getElementById('unencrypted-keys').textContent = 'Loading...';
    
    // Fetch status
    const projectId = currentProject ? currentProject.id : null;
    const queryParams = projectId ? `?project_id=${projectId}` : '';
    
    fetch(`/keys/status${queryParams}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            document.getElementById('total-keys').textContent = data.total_keys;
            document.getElementById('encrypted-keys').textContent = data.encrypted_keys;
            document.getElementById('unencrypted-keys').textContent = data.unencrypted_keys;
        })
        .catch(error => {
            console.error('Error fetching encryption status:', error);
            showNotification(error.message, 'error');
            hideEncryptionStatusModal();
        });
}

function hideEncryptionStatusModal() {
    document.getElementById('encryption-status-modal').style.display = 'none';
}

function handleEncryption(event) {
    event.preventDefault();
    
    const form = event.target;
    const mode = document.getElementById('encryption-mode').value;
    const password = document.getElementById('encryption-password').value;
    const confirmPassword = document.getElementById('encryption-confirm-password').value;
    const scope = document.querySelector('input[name="encryption-scope"]:checked').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Prepare request data
    const data = {
        password: password,
        project_id: scope === 'project' ? currentProject?.id : null
    };
    
    // Disable form
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Processing...
    `;
    
    // Send request
    fetch(`/keys/${mode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Show results
        let message = data.message;
        if (data.failed_keys && data.failed_keys.length > 0) {
            message += `\nFailed to process ${data.failed_keys.length} keys.`;
        }
        
        showNotification(message, data.count > 0 ? 'success' : 'warning');
        
        // Refresh keys display
        loadKeys();
        
        // Close modal
        hideEncryptionModal();
    })
    .catch(error => {
        console.error(`Error ${mode}ing keys:`, error);
        showNotification(error.message, 'error');
    })
    .finally(() => {
        // Reset form state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// Update the refreshKeyCard function to show encryption status
function refreshKeyCard(key) {
    // ... existing code ...
    
    // Add encryption status indicator
    if (key.encrypted) {
        const encryptedBadge = document.createElement('div');
        encryptedBadge.className = 'key-badge encrypted';
        encryptedBadge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Encrypted</span>
        `;
        keyHeader.appendChild(encryptedBadge);
    }
    
    // ... rest of the existing code ...
}