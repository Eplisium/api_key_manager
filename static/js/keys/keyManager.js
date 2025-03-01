import { selectedProject, isEditMode, setIsEditMode, keys, setKeys } from '../state/state.js';
import { showNotification } from '../ui/notifications.js';
import { hideModal } from '../ui/modals.js';

/**
 * Fetch keys from the server
 */
export async function fetchKeys() {
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
        const keysData = await response.json();
        console.log('Received keys:', keysData);
        if (!Array.isArray(keysData)) {
            console.error('Expected array of keys but got:', typeof keysData, keysData);
            throw new Error('Invalid response format');
        }
        
        // Sort keys by position if they have position data
        const sortedKeys = [...keysData].sort((a, b) => {
            // If both have positions, sort by position
            if (a.position !== undefined && b.position !== undefined) {
                return a.position - b.position;
            }
            // If only one has position, prioritize the one with position
            if (a.position !== undefined) return -1;
            if (b.position !== undefined) return 1;
            // If neither has position, maintain original order
            return 0;
        });
        
        console.log('Sorted keys:', sortedKeys);
        
        // Store the keys globally for drag and drop operations
        setKeys(sortedKeys);
        
        // Render the keys
        renderKeys(sortedKeys);
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

/**
 * Render keys in the container
 * @param {Array} keys - The keys to render
 */
export function renderKeys(keys) {
    console.log('Rendering keys:', keys);
    const container = document.getElementById('keys-container');
    container.innerHTML = keys.map(key => `
        <div class="key-card" 
                data-key-id="${key.id}" 
                data-position="${key.position || 0}"
                draggable="true" 
                ondragstart="handleDragStart(event, ${key.id})"
                ondragend="handleDragEnd(event)"
                oncontextmenu="showKeyContextMenu(event, '${key.encrypted ? '[ENCRYPTED]' : key.key.replace(/'/g, "\\'")}', ${key.id}, ${key.encrypted})"
                ondblclick="${key.encrypted ? `showPasswordPrompt('copy', ${key.id})` : `copyToClipboard('${key.key.replace(/'/g, "\\'")}')`}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-semibold">${key.name}</h3>
                    <div class="text-xs text-gray-500 mb-1">Project: ${key.project ? key.project.name : 'None'}</div>
                    ${key.encrypted ? '<div class="key-badge encrypted"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Encrypted</span></div>' : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="${key.encrypted ? `showPasswordPrompt('copy', ${key.id})` : `copyToClipboard('${key.key.replace(/'/g, "\\'")}')`}" class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        <span>Copy</span>
                    </button>
                    <button onclick="${key.encrypted ? `showPasswordPrompt('edit', ${key.id})` : `editKey(${key.id})`}" class="btn-icon">
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
    
    // Add drag and drop event listeners to the container
    container.ondragover = window.handleDragOver;
    container.ondrop = window.handleDrop;
    
    // Add drag and drop event listeners to all project items
    document.querySelectorAll('.project-item').forEach(item => {
        item.ondragover = window.handleDragOver;
        item.ondrop = event => window.handleKeyDrop(event, item.dataset.projectId);
    });
    
    // Store the keys array for reference in drag operations
    window.keys = keys;
}

/**
 * Edit a key
 * @param {number} keyId - The ID of the key to edit
 * @param {Event} event - The click event (optional)
 */
export async function editKey(keyId, event) {
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
        
        setIsEditMode(true);
        document.getElementById('modal-title').textContent = 'Edit Key';
        document.getElementById('key-modal').classList.add('show');
    } catch (error) {
        console.error('Error fetching key:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Delete a key
 * @param {number} keyId - The ID of the key to delete
 * @param {Event} event - The click event (optional)
 */
export async function deleteKey(keyId, event) {
    if (event) {
        event.stopPropagation();
    }
    window.showDeleteKeyModal(keyId);
}

/**
 * Execute key deletion
 */
export async function executeKeyDelete() {
    try {
        const response = await fetch(`/keys/${window.keyToDelete}`, {
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
        window.hideDeleteKeyModal();
    }
}

/**
 * Copy a key to the clipboard
 * @param {string} text - The text to copy
 * @param {Event} event - The click event (optional)
 */
export async function copyToClipboard(text, event) {
    if (event) {
        event.stopPropagation();
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Key copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
    }
}

/**
 * Handle key form submission
 * @param {Event} event - The form submit event
 */
export async function handleFormSubmit(event) {
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

/**
 * Update a key
 * @param {number} keyId - The ID of the key to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated key
 */
export async function updateKey(keyId, data) {
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

/**
 * Refresh a key card with updated data
 * @param {Object} key - The key data
 */
export function refreshKeyCard(key) {
    const keyCard = document.querySelector(`[data-key-id="${key.id}"]`);
    if (!keyCard) return;

    // Create key header section
    const keyHeader = document.createElement('div');
    keyHeader.className = 'flex justify-between items-start mb-4';
    
    // Create left side of header with name and project info
    const leftHeader = document.createElement('div');
    const keyName = document.createElement('h3');
    keyName.className = 'font-semibold';
    keyName.textContent = key.name;
    leftHeader.appendChild(keyName);

    // Add project info
    const projectInfo = document.createElement('div');
    projectInfo.className = 'text-xs text-gray-500 mb-1';
    projectInfo.textContent = `Project: ${key.project ? key.project.name : 'None'}`;
    leftHeader.appendChild(projectInfo);

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
        leftHeader.appendChild(encryptedBadge);
    }
    keyHeader.appendChild(leftHeader);

    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'flex gap-2';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-icon';
    copyBtn.onclick = key.encrypted ? 
        () => window.showPasswordPrompt('copy', key.id) : 
        () => copyToClipboard(key.key);
    copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Copy</span>
    `;
    actions.appendChild(copyBtn);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.onclick = key.encrypted ? 
        () => window.showPasswordPrompt('edit', key.id) : 
        () => editKey(key.id);
    editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
        </svg>
        <span>Edit</span>
    `;
    actions.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon destructive';
    deleteBtn.onclick = () => deleteKey(key.id);
    deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
        <span>Delete</span>
    `;
    actions.appendChild(deleteBtn);
    keyHeader.appendChild(actions);

    // Update description and used_with sections
    const description = document.createElement('div');
    description.className = 'text-sm text-gray-600 mb-2';
    description.textContent = key.description || '';

    const usedWith = document.createElement('div');
    usedWith.className = 'text-sm text-gray-500';
    usedWith.textContent = `Used with: ${key.used_with || 'N/A'}`;

    // Clear and update the key card
    keyCard.innerHTML = '';
    keyCard.appendChild(keyHeader);
    keyCard.appendChild(description);
    keyCard.appendChild(usedWith);

    // Update drag and drop attributes
    keyCard.draggable = true;
    keyCard.ondragstart = (event) => window.handleDragStart(event, key.id);
    keyCard.ondragend = window.handleDragEnd;
    keyCard.oncontextmenu = (event) => window.showKeyContextMenu(event, key.encrypted ? '[ENCRYPTED]' : key.key, key.id, key.encrypted);
    keyCard.ondblclick = key.encrypted ? 
        () => window.showPasswordPrompt('copy', key.id) : 
        () => copyToClipboard(key.key);
}
