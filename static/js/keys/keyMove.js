import { showNotification } from '../ui/notifications.js';
import { fetchKeys } from './keyManager.js';
import { selectedProject, setSelectedProject } from '../state/state.js';

/**
 * Perform key move or copy operation
 * @param {number} keyId - The ID of the key to move
 * @param {number} targetProjectId - The ID of the target project
 * @param {boolean} shouldCopy - Whether to copy the key instead of moving it
 * @param {string} password - The password for encrypted keys (optional)
 * @returns {Promise<void>}
 */
export async function performKeyMove(keyId, targetProjectId, shouldCopy = false, password = null) {
    try {
        // If we have a password, we need to re-encrypt the key after the move/copy
        const needsReEncryption = password !== null;
        
        const response = await fetch('/api/keys/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key_id: keyId,
                target_project_id: targetProjectId,
                is_copy: shouldCopy,
                password: password
            })
        });
        
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let errorMessage = 'Failed to move/copy key';
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorJson = await response.json();
                errorMessage = errorJson.error || errorMessage;
            } else {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // If we need to re-encrypt the key
        if (needsReEncryption) {
            // Get the ID of the key that needs to be re-encrypted
            // If it was a copy operation, use the new key ID from the response
            const keyToEncrypt = shouldCopy && result.key ? result.key.id : keyId;
            
            // Re-encrypt the key
            const encryptResponse = await fetch('/keys/encrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password,
                    key_ids: [parseInt(keyToEncrypt)]
                })
            });
            
            if (!encryptResponse.ok) {
                throw new Error('Failed to re-encrypt key');
            }
            
            // If this was a copy operation, we need to make sure the original key remains encrypted too
            if (shouldCopy) {
                // Re-encrypt the original key as well
                const originalKeyEncryptResponse = await fetch('/keys/encrypt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        password: password,
                        key_ids: [parseInt(keyId)]
                    })
                });
                
                if (!originalKeyEncryptResponse.ok) {
                    throw new Error('Failed to re-encrypt original key');
                }
            }
        }
        
        showNotification(
            `Key ${shouldCopy ? 'copied' : 'moved'} successfully`,
            'success'
        );
        
        // Refresh the keys display to ensure encryption status is correctly shown
        await fetchKeys();
        
        // If we're in a specific project view, make sure we're showing the right project
        if (shouldCopy && targetProjectId !== selectedProject) {
            // If we copied to a different project, stay in the current project view
        } else if (!shouldCopy) {
            // If we moved the key, switch to the target project view
            await selectProject(targetProjectId);
        }
    } catch (error) {
        console.error('Error moving/copying key:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

/**
 * Select a project to view its keys
 * @param {number} projectId - The ID of the project to select
 */
async function selectProject(projectId) {
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
