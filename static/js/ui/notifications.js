/**
 * Display a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
export function showNotification(message, type = 'success') {
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

/**
 * Display a tooltip
 * @param {HTMLElement} element - The element to attach the tooltip to
 * @param {string} text - The tooltip text
 * @returns {HTMLElement} - The tooltip element
 */
export function showTooltip(element, text) {
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

/**
 * Hide a tooltip
 * @param {HTMLElement} tooltip - The tooltip element to hide
 */
export function hideTooltip(tooltip) {
    if (tooltip) {
        tooltip.classList.remove('show');
        setTimeout(() => tooltip.remove(), 200);
    }
}
