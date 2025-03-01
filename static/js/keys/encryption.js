import { showNotification } from '../ui/notifications.js';
import { fetchKeys } from './keyManager.js';
import { selectedProject } from '../state/state.js';

/**
 * Handle encryption of keys
 * @param {Event} event - The form submit event
 */
export async function handleEncryption(event) {
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
        project_id: scope === 'project' && selectedProject ? selectedProject : null
    };
    
    // Validate project selection when scope is 'project'
    if (scope === 'project' && !selectedProject) {
        showNotification('Please select a project first', 'error');
        return;
    }
    
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
    try {
        const response = await fetch(`/keys/${mode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${mode} keys`);
        }
        
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Show results
        let message = result.message;
        if (result.failed_keys && result.failed_keys.length > 0) {
            message += `\nFailed to process ${result.failed_keys.length} keys.`;
        }
        
        showNotification(message, result.count > 0 ? 'success' : 'warning');
        
        // Refresh keys display
        fetchKeys();
        
        // Close modal
        document.getElementById('encryption-modal').style.display = 'none';
    } catch (error) {
        console.error(`Error ${mode}ing keys:`, error);
        showNotification(error.message, 'error');
    } finally {
        // Reset form state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Show encryption status
 */
export async function showEncryptionStatus() {
    const modal = document.getElementById('encryption-status-modal');
    modal.style.display = 'flex';
    
    // Reset counters
    document.getElementById('total-keys').textContent = 'Loading...';
    document.getElementById('encrypted-keys').textContent = 'Loading...';
    document.getElementById('unencrypted-keys').textContent = 'Loading...';
    
    // Fetch status
    const projectId = selectedProject ? selectedProject : null;
    const queryParams = projectId ? `?project_id=${projectId}` : '';
    
    try {
        const response = await fetch(`/keys/status${queryParams}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        document.getElementById('total-keys').textContent = data.total_keys;
        document.getElementById('encrypted-keys').textContent = data.encrypted_keys;
        document.getElementById('unencrypted-keys').textContent = data.unencrypted_keys;
    } catch (error) {
        console.error('Error fetching encryption status:', error);
        showNotification(error.message, 'error');
        hideEncryptionStatusModal();
    }
}

/**
 * Hide encryption status modal
 */
export function hideEncryptionStatusModal() {
    document.getElementById('encryption-status-modal').style.display = 'none';
}

/**
 * Perform export with password for encrypted keys
 * @param {string} format - The export format
 * @param {string} password - The password for decryption
 */
export function performExport(format, password = null) {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    if (selectedProject) {
        queryParams.append('project_id', selectedProject);
    }
    
    if (password) {
        queryParams.append('password', password);
    }
    
    window.location.href = `/export?${queryParams.toString()}`;
}
