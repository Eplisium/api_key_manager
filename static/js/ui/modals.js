import { isEditMode, setIsEditMode, isProjectEditMode, setIsProjectEditMode, currentKeyAction, currentKeyData, setCurrentKeyAction, setCurrentKeyData } from '../state/state.js';
import { showNotification } from './notifications.js';
import { fetchKeys } from '../keys/keyManager.js';
import { performKeyMove } from '../keys/keyMove.js';

/**
 * Show the project modal for adding or editing a project
 */
export function showProjectModal() {
    setIsProjectEditMode(false);
    document.getElementById('project-form').reset();
    document.getElementById('project-modal-title').textContent = 'New Project';
    document.getElementById('project-modal').classList.add('show');
}

/**
 * Hide the project modal
 */
export function hideProjectModal() {
    document.getElementById('project-modal').classList.remove('show');
}

/**
 * Show the key modal for adding a new key
 */
export function showAddModal() {
    setIsEditMode(false);
    document.getElementById('modal-title').textContent = 'Add New Key';
    document.getElementById('key-form').reset();
    document.getElementById('key-id').value = '';
    document.getElementById('key-modal').classList.add('show');
}

/**
 * Hide the key modal
 */
export function hideModal() {
    document.getElementById('key-modal').classList.remove('show');
}

/**
 * Show the delete key confirmation modal
 * @param {number} keyId - The ID of the key to delete
 */
export function showDeleteKeyModal(keyId) {
    window.keyToDelete = keyId;
    document.getElementById('delete-key-modal').classList.add('show');
}

/**
 * Hide the delete key confirmation modal
 */
export function hideDeleteKeyModal() {
    document.getElementById('delete-key-modal').classList.remove('show');
    window.keyToDelete = null;
}

/**
 * Show the delete project confirmation modal
 * @param {number} projectId - The ID of the project to delete
 */
export function showDeleteProjectModal(projectId) {
    window.projectToDelete = projectId;
    const projectName = document.querySelector(`.project-item[data-project-id="${projectId}"] .project-name`).textContent;
    
    // Update the modal message with project name
    document.querySelector('.delete-project-message').textContent = 
        `What would you like to do with "${projectName}" and its associated keys?`;
    
    document.getElementById('delete-project-modal').classList.add('show');
}

/**
 * Hide the delete project confirmation modal
 */
export function hideDeleteProjectModal() {
    document.getElementById('delete-project-modal').classList.remove('show');
    window.projectToDelete = null;
}

/**
 * Show the password prompt modal
 * @param {string} action - The action to perform ('copy', 'edit', 'export', 'move')
 * @param {number} keyId - The ID of the key
 */
export function showPasswordPrompt(action, keyId) {
    setCurrentKeyAction(action);
    document.getElementById('password-prompt-action').value = action;
    document.getElementById('password-prompt-key-id').value = keyId;
    document.getElementById('password-prompt-input').value = '';
    document.getElementById('password-prompt-modal').classList.add('show');
}

/**
 * Hide the password prompt modal
 */
export function hidePasswordPrompt() {
    document.getElementById('password-prompt-modal').classList.remove('show');
    
    // Only clear currentKeyAction and currentKeyData if not in the middle of a move operation
    if (currentKeyAction !== 'move') {
        setCurrentKeyAction(null);
        setCurrentKeyData(null);
    }
}

/**
 * Handle password prompt form submission
 * @param {Event} event - The form submit event
 */
export async function handlePasswordSubmit(event) {
    event.preventDefault();
    
    const password = document.getElementById('password-prompt-input').value;
    const action = document.getElementById('password-prompt-action').value;
    const keyId = document.getElementById('password-prompt-key-id').value;
    
    try {
        if (action === 'export') {
            performExport(currentKeyData.format, password);
            hidePasswordPrompt();
            return;
        }
        
        // Handle move/copy action for encrypted keys
        if (action === 'move' && currentKeyData) {
            // First decrypt the key
            const decryptResponse = await fetch('/keys/decrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password,
                    key_ids: [parseInt(keyId)]
                })
            });
            
            if (!decryptResponse.ok) {
                throw new Error('Invalid password');
            }
            
            // Perform the move/copy
            await performKeyMove(
                currentKeyData.keyId,
                currentKeyData.targetProjectId,
                currentKeyData.shouldCopy,
                password // Pass the password to performKeyMove
            );
            
            // Clear the action and data after successful move
            setCurrentKeyAction(null);
            setCurrentKeyData(null);
            hidePasswordPrompt();
            return;
        }
        
        // Handle other password-protected actions
        const response = await fetch('/keys/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: password,
                key_ids: keyId ? [parseInt(keyId)] : undefined
            })
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Invalid password');
        }
        
        // Get the decrypted key data
        if (keyId) {
            const keyResponse = await fetch(`/keys/${keyId}`);
            if (!keyResponse.ok) {
                throw new Error('Failed to fetch key data');
            }
            const keyData = await keyResponse.json();
            
            // Perform the requested action
            if (action === 'copy') {
                await copyToClipboard(keyData.key);
            } else if (action === 'edit') {
                await performEdit(keyData);
            }
            
            // Re-encrypt the key immediately
            await fetch('/keys/encrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password,
                    key_ids: [parseInt(keyId)]
                })
            });
        }
        
        hidePasswordPrompt();
        
        // Refresh the keys display
        await fetchKeys();
        
    } catch (error) {
        console.error('Error handling password:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Perform edit operation on a key
 * @param {Object} keyData - The key data
 */
export async function performEdit(keyData) {
    document.getElementById('key-id').value = keyData.id;
    document.getElementById('name').value = keyData.name;
    document.getElementById('key').value = keyData.key;
    document.getElementById('description').value = keyData.description || '';
    document.getElementById('used-with').value = keyData.used_with || '';
    document.getElementById('project').value = keyData.project ? keyData.project.id : '';
    
    setIsEditMode(true);
    document.getElementById('modal-title').textContent = 'Edit Key';
    document.getElementById('key-modal').classList.add('show');
}

/**
 * Show the key move modal
 * @param {number} keyId - The ID of the key to move
 * @param {number} targetProjectId - The ID of the target project
 */
export function showKeyMoveModal(keyId, targetProjectId) {
    // Get the key and target project
    const keyCard = document.querySelector(`[data-key-id="${keyId}"]`);
    const targetProject = document.querySelector(`[data-project-id="${targetProjectId}"]`);
    
    if (!keyCard || !targetProject) return;
    
    const keyName = keyCard.querySelector('.font-semibold').textContent;
    const projectName = targetProject.querySelector('.project-name').textContent;
    
    document.getElementById('key-move-name').textContent = keyName;
    document.getElementById('key-move-project').textContent = projectName;
    
    // Store the data for the move operation
    setCurrentKeyData({
        keyId: keyId,
        targetProjectId: targetProjectId,
        shouldCopy: false
    });
    
    document.getElementById('key-move-modal').classList.add('show');
}

/**
 * Hide the key move modal
 * @param {boolean} clearData - Whether to clear the current key data
 */
export function hideKeyMoveModal(clearData = true) {
    document.getElementById('key-move-modal').classList.remove('show');
    // Only clear currentKeyData if clearData is true.
    if (clearData) {
        setCurrentKeyData(null);
    }
}

/**
 * Execute key move or copy operation
 * @param {boolean} shouldCopy - Whether to copy the key instead of moving it
 */
export async function executeKeyMove(shouldCopy = false) {
    if (!currentKeyData) return;
    
    currentKeyData.shouldCopy = shouldCopy;
    const keyCard = document.querySelector(`[data-key-id="${currentKeyData.keyId}"]`);
    
    if (!keyCard) {
        showNotification('Error: Key not found', 'error');
        hideKeyMoveModal();
        return;
    }
    
    // Find the key in our keys array to check if it's encrypted
    const key = window.keys.find(k => k.id == currentKeyData.keyId);
    
    // If the key is encrypted, show password prompt
    if (key && key.encrypted) {
        hideKeyMoveModal(false); // Pass false to preserve currentKeyData
        showPasswordPrompt('move', currentKeyData.keyId);
        return;
    }
    
    // If not encrypted, perform the move/copy directly
    try {
        await performKeyMove(
            currentKeyData.keyId,
            currentKeyData.targetProjectId,
            shouldCopy
        );
        hideKeyMoveModal();
    } catch (error) {
        console.error('Error moving/copying key:', error);
        showNotification(error.message, 'error');
        hideKeyMoveModal();
    }
}

/**
 * Show the post-import modal
 * @param {Array} keys - The imported keys
 */
export function showPostImportModal(keys) {
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

/**
 * Hide the post-import modal
 */
export function hidePostImportModal() {
    document.getElementById('post-import-modal').classList.remove('show');
    fetchKeys(); // Refresh the keys list
}

/**
 * Show the encryption modal
 * @param {string} mode - The encryption mode ('encrypt' or 'decrypt')
 */
export function showEncryptionModal(mode) {
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

/**
 * Hide the encryption modal
 */
export function hideEncryptionModal() {
    document.getElementById('encryption-modal').style.display = 'none';
}

/**
 * Show the encryption status modal
 */
export function showEncryptionStatus() {
    const modal = document.getElementById('encryption-status-modal');
    modal.style.display = 'flex';
    
    // Reset counters
    document.getElementById('total-keys').textContent = 'Loading...';
    document.getElementById('encrypted-keys').textContent = 'Loading...';
    document.getElementById('unencrypted-keys').textContent = 'Loading...';
    
    // Fetch status
    const projectId = window.selectedProject ? window.selectedProject : null;
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

/**
 * Hide the encryption status modal
 */
export function hideEncryptionStatusModal() {
    document.getElementById('encryption-status-modal').style.display = 'none';
}

/**
 * Show the import database modal
 */
export function showImportDBModal() {
    const modal = document.getElementById('import-db-modal');
    modal.classList.add('show');
    document.getElementById('manage-db-dropdown').classList.remove('show');
}

/**
 * Hide the import database modal
 */
export function hideImportDBModal() {
    const modal = document.getElementById('import-db-modal');
    modal.classList.remove('show');
    document.getElementById('db-file').value = '';  // Reset file input
}

/**
 * Show the clear keys confirmation modal
 */
export function confirmClearAllKeys() {
    const projectName = window.selectedProject ? 
        document.querySelector(`.project-item[data-project-id="${window.selectedProject}"]`)?.querySelector('.project-name')?.textContent : 
        'all projects';
    
    const message = window.selectedProject ? 
        `Are you sure you want to delete ALL keys from "${projectName}"?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.` :
        `Are you sure you want to delete ALL keys from all projects?<br><br>This action cannot be undone. There is no built-in way to recover deleted keys.<br><br>Tip: Consider exporting your keys before deletion for backup.`;

    document.getElementById('clear-keys-message').innerHTML = message;
    document.getElementById('clear-keys-modal').classList.add('show');
}

/**
 * Hide the clear keys confirmation modal
 */
export function hideClearKeysModal() {
    document.getElementById('clear-keys-modal').classList.remove('show');
}

/**
 * Show the color picker modal
 * @param {Event} event - The click event
 */
export function showColorPickerModal(event) {
    console.log('showColorPickerModal called', event);
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    // Add a small delay to ensure the context menu is fully prevented
    setTimeout(() => {
        const modal = document.getElementById('color-picker-modal');
        if (!modal) {
            console.error('Color picker modal element not found');
            return;
        }
        
        // Add a fade-in class for smooth appearance
        modal.classList.add('fade-in');
        modal.classList.add('show');
        
        // Get current colors from localStorage or elements
        let currentColor;
        const title = document.querySelector('.title');
        const titleKey = document.querySelector('.title-key');
        
        // Determine which color to use based on current state
        if (title.classList.contains('rainbow')) {
            currentColor = '#ff0000'; // Default rainbow start color
        } else if (titleKey && titleKey.style.color) {
            // Get color from the key element if it has a custom color
            try {
                const computedColor = getComputedStyle(titleKey).color;
                const rgbValues = computedColor.match(/\d+/g);
                if (rgbValues && rgbValues.length === 3) {
                    currentColor = rgbToHex(
                        parseInt(rgbValues[0]),
                        parseInt(rgbValues[1]),
                        parseInt(rgbValues[2])
                    );
                } else {
                    // Fallback to default color
                    currentColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#FFFFFF' : '#000000';
                }
            } catch (e) {
                console.error('Error parsing color:', e);
                currentColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#FFFFFF' : '#000000';
            }
        } else {
            // Use stored color or default based on theme
            currentColor = localStorage.getItem('customTitleColor') || 
                (document.documentElement.getAttribute('data-theme') === 'dark' ? '#FFFFFF' : '#000000');
        }
        
        // Initialize color picker with the determined color
        initializeColorPicker(currentColor);
        
        // Reset word selection to 'all'
        window.selectedWord = 'all';
        document.querySelectorAll('.word-select-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.word === 'all');
        });
        
        // Check if rainbow is active
        const isRainbow = localStorage.getItem('titleRainbow') === 'true';
        console.log('Is rainbow active:', isRainbow);
        
        if (isRainbow) {
            window.selectedColorOption = 'rainbow';
            const rainbowBtn = document.getElementById('rainbow-btn');
            const solidColorBtn = document.getElementById('solid-color-btn');
            
            if (rainbowBtn) rainbowBtn.classList.add('active');
            if (solidColorBtn) solidColorBtn.classList.remove('active');
            
            const colorPickerControls = document.getElementById('color-picker-controls');
            const hexColorContainer = document.getElementById('hex-color')?.parentElement?.parentElement;
            const rgbContainer = document.getElementById('rgb-r')?.parentElement?.parentElement?.parentElement;
            
            if (colorPickerControls) colorPickerControls.style.display = 'none';
            if (hexColorContainer) hexColorContainer.style.display = 'none';
            if (rgbContainer) rgbContainer.style.display = 'none';
            
            // Update preview to show rainbow
            const previewText = document.querySelector('.preview-text');
            if (previewText) {
                previewText.classList.add('rainbow');
                previewText.classList.remove('color-transition'); // Remove transition to avoid glitches
                
                // Force a reflow to ensure the rainbow animation starts fresh
                void previewText.offsetWidth;
                
                // Add transition back after a small delay
                setTimeout(() => {
                    previewText.classList.add('color-transition');
                }, 50);
            }
        } else {
            window.selectedColorOption = 'solid';
            const rainbowBtn = document.getElementById('rainbow-btn');
            const solidColorBtn = document.getElementById('solid-color-btn');
            
            if (solidColorBtn) solidColorBtn.classList.add('active');
            if (rainbowBtn) rainbowBtn.classList.remove('active');
            
            const colorPickerControls = document.getElementById('color-picker-controls');
            const hexColorContainer = document.getElementById('hex-color')?.parentElement?.parentElement;
            const rgbContainer = document.getElementById('rgb-r')?.parentElement?.parentElement?.parentElement;
            
            if (colorPickerControls) colorPickerControls.style.display = 'block';
            if (hexColorContainer) hexColorContainer.style.display = 'block';
            if (rgbContainer) rgbContainer.style.display = 'block';
            
            // Update preview to show solid color
            const previewText = document.querySelector('.preview-text');
            if (previewText) {
                previewText.classList.remove('rainbow');
            }
        }
        
        // Set initial preview background based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const previewBg = document.getElementById('preview-background');
        if (previewBg) {
            previewBg.value = currentTheme || 'light';
            updatePreviewBackground();
        }
        
        // Focus on the color wheel for immediate interaction
        setTimeout(() => {
            document.getElementById('color-wheel')?.focus();
        }, 100);
    }, 10);
}

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Hide the color picker modal
 */
export function hideColorPickerModal() {
    document.getElementById('color-picker-modal').classList.remove('show');
}

/**
 * Initialize the color picker with a color
 * @param {string} color - The color to initialize with
 */
export function initializeColorPicker(color) {
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

/**
 * Update the preview colors in the color picker
 */
export function updatePreviewColors() {
    const color = document.getElementById('color-wheel').value;
    if (window.selectedColorOption === 'rainbow') {
        document.querySelector('.preview-text').classList.add('rainbow');
        return;
    }
    
    document.querySelector('.preview-text').classList.remove('rainbow');
    
    if (window.selectedWord === 'all') {
        document.querySelectorAll('.preview-text span').forEach(span => {
            span.style.color = color;
        });
    } else {
        document.querySelector(`.preview-${window.selectedWord}`).style.color = color;
    }
}

/**
 * Update the preview background in the color picker
 */
export function updatePreviewBackground() {
    const previewText = document.querySelector('.preview-text');
    const bgValue = document.getElementById('preview-background').value;
    const hasRainbow = previewText.classList.contains('rainbow');
    
    previewText.classList.remove('dark-bg', 'light-bg');
    previewText.classList.add(`${bgValue}-bg`);
    
    // Preserve rainbow class if it was active
    if (hasRainbow) {
        previewText.classList.add('rainbow');
    }
}

/**
 * Apply the custom color from the color picker
 */
export function applyCustomColor() {
    const title = document.querySelector('.title');
    const titleApi = document.querySelector('.title-api');
    const titleKey = document.querySelector('.title-key');
    const titleManager = document.querySelector('.title-manager');
    const projectBadge = document.getElementById('selected-project-name');
    
    // First, clear all existing rainbow classes and inline styles
    title.classList.remove('rainbow');
    titleApi.classList.remove('rainbow');
    titleKey.classList.remove('rainbow');
    titleManager.classList.remove('rainbow');
    projectBadge.classList.remove('rainbow');
    
    // Reset inline colors
    titleApi.style.color = '';
    titleKey.style.color = '';
    titleManager.style.color = '';
    projectBadge.style.color = '';
    
    // Clear localStorage values
    localStorage.setItem('titleRainbow', 'false');
    localStorage.setItem('apiRainbow', 'false');
    localStorage.setItem('keyRainbow', 'false');
    localStorage.setItem('managerRainbow', 'false');
    localStorage.setItem('projectRainbow', 'false');
    
    if (window.selectedColorOption === 'rainbow') {
        // Apply rainbow effect
        title.classList.add('rainbow');
        projectBadge.classList.add('rainbow');
        localStorage.setItem('titleRainbow', 'true');
        localStorage.setItem('projectRainbow', 'true');
        
        // Force a reflow to ensure the rainbow animation starts fresh
        void title.offsetWidth;
        void projectBadge.offsetWidth;
        
        // Show a notification
        showNotification('Rainbow effect applied', 'success');
    } else {
        // Apply solid color
        const color = document.getElementById('color-wheel').value;
        
        if (window.selectedWord === 'all') {
            // Apply to all spans
            titleApi.style.color = color;
            titleKey.style.color = color;
            titleManager.style.color = color;
            projectBadge.style.color = color;
            
            // Save to localStorage
            localStorage.setItem('titleColor_api', color);
            localStorage.setItem('titleColor_key', color);
            localStorage.setItem('titleColor_manager', color);
            localStorage.setItem('projectColor', color);
        } else {
            // Apply to specific element
            const targetSpan = document.querySelector(`.title-${window.selectedWord}`);
            if (targetSpan) {
                targetSpan.style.color = color;
                localStorage.setItem(`titleColor_${window.selectedWord}`, color);
            }
            
            // If applying to project, update project badge
            if (window.selectedWord === 'project' && projectBadge) {
                projectBadge.style.color = color;
                localStorage.setItem('projectColor', color);
            }
        }
        
        // Show a notification
        showNotification('Color applied successfully', 'success');
    }
    
    hideColorPickerModal();
}

/**
 * Reset the title color to default
 */
export function resetTitleColor() {
    // Remove any custom colors and rainbow effect from title
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

    // Update preview text colors
    document.querySelectorAll('.preview-text span').forEach(span => {
        span.style.color = defaultColor;
    });
    
    // Also reset project badge color to the default
    document.getElementById('selected-project-name').style.color = defaultColor;
}

// Helper function for color picker
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
