import { activeProjectId, setActiveProjectId, activeKeyValue, activeKeyId, setActiveKeyValue, setActiveKeyId } from '../state/state.js';
import { showNotification } from './notifications.js';
import { editProject, deleteProject } from '../projects/projectManager.js';
import { copyToClipboard } from '../keys/keyManager.js';

/**
 * Show the project context menu
 * @param {Event} event - The context menu event
 * @param {number} projectId - The ID of the project
 */
export function showContextMenu(event, projectId) {
    event.preventDefault();
    event.stopPropagation();
    
    const contextMenu = document.getElementById('project-context-menu');
    const projectItem = event.currentTarget;
    const projectName = projectItem.querySelector('.project-name').textContent;
    setActiveProjectId(projectId);
    
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
    
    // Position the menu at cursor with boundary checks
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX;
    let top = event.clientY;
    
    // Adjust horizontal position if menu would go off-screen
    if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 10;
    }
    
    // Adjust vertical position if menu would go off-screen
    if (top + menuHeight > viewportHeight) {
        top = viewportHeight - menuHeight - 10;
    }
    
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    contextMenu.classList.add('show');
    
    // Add click listener to close menu when clicking outside
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('contextmenu', hideContextMenu);
}

/**
 * Hide the project context menu
 */
export function hideContextMenu() {
    const contextMenu = document.getElementById('project-context-menu');
    contextMenu.classList.remove('show');
    setActiveProjectId(null);
    
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

/**
 * Edit a project from the context menu
 * @param {Event} event - The click event
 */
export function editProjectFromMenu(event) {
    event.preventDefault();
    if (activeProjectId !== null) {
        editProject(activeProjectId);
    }
    hideContextMenu();
}

/**
 * Delete a project from the context menu
 * @param {Event} event - The click event
 */
export function deleteProjectFromMenu(event) {
    event.preventDefault();
    if (activeProjectId !== null) {
        deleteProject(activeProjectId);
    }
    hideContextMenu();
}

/**
 * Show the key context menu
 * @param {Event} event - The context menu event
 * @param {string} keyValue - The value of the key
 * @param {number} keyId - The ID of the key
 * @param {boolean} isEncrypted - Whether the key is encrypted
 */
export function showKeyContextMenu(event, keyValue, keyId, isEncrypted) {
    event.preventDefault();
    event.stopPropagation();
    
    const contextMenu = document.getElementById('key-context-menu');
    setActiveKeyValue(keyValue);
    setActiveKeyId(keyId);
    
    // Update the key value display
    const keyDisplay = contextMenu.querySelector('.key-context-value');
    keyDisplay.innerHTML = ''; // Clear previous content
    
    if (isEncrypted) {
        // For encrypted keys, show a placeholder, encrypted badge, and password input
        keyDisplay.innerHTML = `
            <div class="encrypted-key-header">
                <span>[ENCRYPTED]</span>
                <div class="key-badge encrypted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Encrypted</span>
                </div>
            </div>
            <div class="password-input-container">
                <input type="password" class="password-input" placeholder="Enter password to view" onkeydown="handlePasswordKeyDown(event, ${keyId})">
                <button class="view-key-btn" onclick="viewEncryptedKey(${keyId})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                </button>
            </div>
            <div class="decrypted-value" style="display: none;"></div>
        `;
    } else {
        // For unencrypted keys, show the actual value
        keyDisplay.textContent = keyValue;
    }
    
    // Update copy button to handle encryption
    const copyButton = contextMenu.querySelector('.context-menu-item');
    copyButton.onclick = isEncrypted ? 
        () => { hideKeyContextMenu(); showPasswordPrompt('copy', keyId); } : 
        () => { hideKeyContextMenu(); copyToClipboard(keyValue); };
    
    // Position the menu at cursor
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.classList.add('show');
    
    // Add click listener to close menu when clicking outside
    document.addEventListener('click', handleContextMenuClick);
    document.addEventListener('contextmenu', hideKeyContextMenu);
}

/**
 * Handle clicks outside the key context menu
 * @param {Event} event - The click event
 */
export function handleContextMenuClick(event) {
    const contextMenu = document.getElementById('key-context-menu');
    if (!contextMenu.contains(event.target)) {
        hideKeyContextMenu();
    }
}

/**
 * Hide the key context menu
 */
export function hideKeyContextMenu() {
    const contextMenu = document.getElementById('key-context-menu');
    contextMenu.classList.remove('show');
    setActiveKeyValue(null);
    setActiveKeyId(null);
    
    // Remove click listeners
    document.removeEventListener('click', handleContextMenuClick);
    document.removeEventListener('contextmenu', hideKeyContextMenu);
}

/**
 * Copy a key from the context menu
 * @param {Event} event - The click event
 */
export function copyKeyFromMenu(event) {
    event.preventDefault();
    if (activeKeyValue !== null) {
        copyToClipboard(activeKeyValue);
    }
    hideKeyContextMenu();
}

/**
 * Handle password input keydown event
 * @param {Event} event - The keydown event
 * @param {number} keyId - The ID of the key
 */
export async function handlePasswordKeyDown(event, keyId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        await viewEncryptedKey(keyId);
    }
}

/**
 * View an encrypted key
 * @param {number} keyId - The ID of the key
 */
export async function viewEncryptedKey(keyId) {
    const contextMenu = document.getElementById('key-context-menu');
    const passwordInput = contextMenu.querySelector('.password-input');
    const decryptedValueDiv = contextMenu.querySelector('.decrypted-value');
    const encryptedHeader = contextMenu.querySelector('.encrypted-key-header');
    const passwordContainer = contextMenu.querySelector('.password-input-container');
    
    try {
        // First decrypt the key
        const response = await fetch('/keys/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: passwordInput.value,
                key_ids: [parseInt(keyId)]
            })
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Invalid password');
        }
        
        // Get the decrypted key data
        const keyResponse = await fetch(`/keys/${keyId}`);
        if (!keyResponse.ok) {
            throw new Error('Failed to fetch key data');
        }
        const keyData = await keyResponse.json();
        
        // Show the decrypted value
        decryptedValueDiv.textContent = keyData.key;
        decryptedValueDiv.style.display = 'block';
        
        // Hide the password input and encrypted header
        encryptedHeader.style.display = 'none';
        passwordContainer.style.display = 'none';
        
        // Re-encrypt the key immediately
        await fetch('/keys/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: passwordInput.value,
                key_ids: [parseInt(keyId)]
            })
        });
        
    } catch (error) {
        console.error('Error viewing encrypted key:', error);
        showNotification(error.message, 'error');
        
        // Reset the password input on error
        passwordInput.value = '';
        passwordInput.focus();
    }
}
