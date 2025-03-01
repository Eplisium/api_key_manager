import { showNotification } from '../ui/notifications.js';
import { showPostImportModal } from '../ui/modals.js';
import { fetchKeys } from '../keys/keyManager.js';
import { selectedProject } from '../state/state.js';
import { performExport } from '../keys/encryption.js';

/**
 * Handle environment file upload
 * @param {Event} event - The file input change event
 */
export async function handleEnvFileUpload(event) {
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

/**
 * Import environment variables from OS
 */
export async function importFromOS() {
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

/**
 * Export keys in the specified format
 * @param {string} format - The export format
 */
export async function exportKeys(format) {
    try {
        // Check if we have any encrypted keys first
        const response = await fetch(`/keys/status${selectedProject ? `?project_id=${selectedProject}` : ''}`);
        const status = await response.json();
        
        if (status.encrypted_keys > 0) {
            // Show password prompt for decryption
            window.currentKeyAction = 'export';
            window.currentKeyData = { format };  // Store format for later use
            window.showPasswordPrompt('export');
            return;
        }
        
        // If no encrypted keys, proceed with normal export
        performExport(format);
    } catch (error) {
        console.error('Error during export:', error);
        showNotification('Failed to check encryption status', 'error');
    }
}

/**
 * Toggle the export dropdown
 */
export function toggleExportDropdown() {
    document.getElementById("export-dropdown").classList.toggle("show");
}

/**
 * Toggle the import dropdown
 */
export function toggleImportDropdown() {
    document.getElementById("import-dropdown").classList.toggle("show");
}

/**
 * Apply bulk "Used with" value to all imported keys
 */
export function applyBulkUsedWith() {
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

/**
 * Apply bulk description to all imported keys
 */
export function applyBulkDescription() {
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

/**
 * Clear all descriptions from imported keys
 */
export function clearAllDescriptions() {
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

/**
 * Toggle selection of all imported keys
 */
export function toggleAllKeys() {
    window.allKeysSelected = !window.allKeysSelected;
    const checkboxes = document.querySelectorAll('.key-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = window.allKeysSelected;
    });
    document.getElementById('select-all-text').textContent = window.allKeysSelected ? 'Deselect All' : 'Select All';
}

/**
 * Remove unselected keys from the import
 */
export async function removeUnselectedKeys() {
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

/**
 * Save configuration for imported keys
 */
export async function saveImportedKeysConfig() {
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
        document.getElementById('post-import-modal').classList.remove('show');
        fetchKeys();
    } catch (error) {
        console.error('Error updating imported keys:', error);
        showNotification('Some keys failed to update. Please try again.', 'error');
    }
}

/**
 * Update a key
 * @param {number} keyId - The ID of the key to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated key
 */
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

/**
 * Confirm clearing all keys
 */
export function confirmClearAllKeys() {
    const projectName = selectedProject ? 
        document.querySelector(`.project-item[data-project-id="${selectedProject}"]`)?.querySelector('.project-name')?.textContent : 
        'all projects';
    
    const message = selectedProject ? 
        `Are you sure you want to delete ALL keys from "${projectName}"?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.` :
        `Are you sure you want to delete ALL keys from all projects?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.`;

    document.getElementById('clear-keys-message').innerHTML = message;
    document.getElementById('clear-keys-modal').classList.add('show');
}

/**
 * Execute clearing all keys
 */
export async function executeClearAllKeys() {
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
        document.getElementById('clear-keys-modal').classList.remove('show');
    }
}
