import { showNotification } from '../ui/notifications.js';

/**
 * Download the database
 */
export function downloadDatabase() {
    // Target the specific download button, not the "New Project" or "Show All" buttons
    const button = document.querySelector('.download-db-btn:not(.collapsed-new-project):not(.collapsed-show-all)');
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

/**
 * Toggle the manage database dropdown
 * @param {Event} event - The click event
 */
export function toggleManageDBDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('manage-db-dropdown');
    const button = document.querySelector('.manage-db-btn');
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
            
            // Ensure the dropdown is visible
            dropdown.style.display = 'block';
            dropdown.style.zIndex = '2000';
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
            if (!e.target.closest('.manage-db-btn') && !e.target.closest('.manage-db-dropdown')) {
                dropdown.classList.remove('show');
                // Reset positioning styles
                dropdown.style.left = '';
                dropdown.style.right = '';
                dropdown.style.top = '';
                dropdown.style.bottom = '';
                dropdown.style.transform = '';
                dropdown.style.marginTop = '';
                dropdown.style.marginBottom = '';
                dropdown.style.display = '';
                dropdown.style.zIndex = '';
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

/**
 * Handle database import form submission
 * @param {Event} event - The form submit event
 */
export async function handleDBImport(event) {
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
            document.getElementById('import-db-modal').classList.remove('show');
            
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
