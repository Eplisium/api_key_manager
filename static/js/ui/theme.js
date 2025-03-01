import { showColorPickerModal } from './modals.js';

// Add a debounce flag to prevent rapid toggles
let isThemeToggling = false;

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
    // Prevent rapid toggles
    if (isThemeToggling) {
        console.log('Theme toggle in progress, ignoring click');
        return;
    }
    
    isThemeToggling = true;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    console.log('Current theme before toggle:', currentTheme);
    
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    console.log('Switching to theme:', newTheme);
    
    setTheme(newTheme);
    
    // Verify the theme was changed
    console.log('Theme after toggle:', document.documentElement.getAttribute('data-theme'));
    
    // Reset the flag after a short delay
    setTimeout(() => {
        isThemeToggling = false;
        console.log('Theme toggle complete, ready for next toggle');
    }, 500);
}

/**
 * Set the application theme
 * @param {string} theme - The theme to set ('light' or 'dark')
 */
export function setTheme(theme) {
    console.log('Setting theme to:', theme);
    
    // Set the theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add a transition class to the body to make the change more visible
    document.body.classList.add('theme-transition');
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update the theme toggle icons
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (theme === 'dark') {
        console.log('Showing light icon (for dark theme)');
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    } else {
        console.log('Showing dark icon (for light theme)');
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
    }
    
    // Remove the transition class after the transition is complete
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 300); // Match this with the CSS transition duration
}

/**
 * Initialize theme from localStorage or default to light
 */
export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Initializing theme from localStorage:', savedTheme);
    
    // Make sure the correct icon is visible initially
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (!darkIcon || !lightIcon) {
        console.error('Theme toggle icons not found in the DOM');
    } else {
        console.log('Theme icons found, setting initial visibility');
        
        if (savedTheme === 'dark') {
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        } else {
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        }
    }
    
    // Set the theme
    setTheme(savedTheme);
    
    // Verify the theme was set
    console.log('Theme after initialization:', document.documentElement.getAttribute('data-theme'));
}

/**
 * Toggle the sidebar visibility
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleButton = document.getElementById('toggle-sidebar');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    toggleButton.classList.toggle('rotated');
    
    // Save the state
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

/**
 * Initialize sidebar state from localStorage
 */
export function initializeSidebar() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const toggleButton = document.getElementById('toggle-sidebar');
        
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        toggleButton.classList.add('rotated');
    }
}

/**
 * Toggle rainbow effect for title and project badge
 * @param {Event} event - The click event
 */
export function toggleRainbow(event) {
    console.log('toggleRainbow called with event type:', event.type, 'shift key:', event.shiftKey);
    
    // For left-click, only proceed if the shift key is pressed
    if (event.type === 'contextmenu') {
        // This should not be called for contextmenu events anymore
        // We're handling contextmenu separately in initializeRainbowEffects
        return;
    }
    
    // For left-click, only proceed if the shift key is pressed
    if (!event.shiftKey) {
        console.log('Shift key not pressed, returning');
        return;
    }
    
    const title = document.querySelector('.title');
    const titleApi = document.querySelector('.title-api');
    const titleKey = document.querySelector('.title-key');
    const titleManager = document.querySelector('.title-manager');
    const projectBadge = document.getElementById('selected-project-name');
    
    // Check current state
    const titleRainbow = title.classList.contains('rainbow');
    const apiRainbow = titleApi.classList.contains('rainbow');
    const keyRainbow = titleKey.classList.contains('rainbow');
    const managerRainbow = titleManager.classList.contains('rainbow');
    const projectRainbow = projectBadge.classList.contains('rainbow');
    
    // If any individual element has rainbow, remove all rainbows
    if (apiRainbow || keyRainbow || managerRainbow || projectRainbow) {
        // Remove all rainbow effects
        title.classList.remove('rainbow');
        titleApi.classList.remove('rainbow');
        titleKey.classList.remove('rainbow');
        titleManager.classList.remove('rainbow');
        projectBadge.classList.remove('rainbow');
        
        // Update localStorage
        localStorage.setItem('titleRainbow', 'false');
        localStorage.setItem('apiRainbow', 'false');
        localStorage.setItem('keyRainbow', 'false');
        localStorage.setItem('managerRainbow', 'false');
        localStorage.setItem('projectRainbow', 'false');
        
        // Reset colors
        titleApi.style.color = '';
        titleKey.style.color = '';
        titleManager.style.color = '';
        projectBadge.style.color = '';
        
        // Clear stored colors
        localStorage.removeItem('titleColor_api');
        localStorage.removeItem('titleColor_key');
        localStorage.removeItem('titleColor_manager');
        localStorage.removeItem('projectColor');
    } else if (titleRainbow) {
        // If title has rainbow, remove it
        title.classList.remove('rainbow');
        localStorage.setItem('titleRainbow', 'false');
    } else {
        // If no rainbows, add rainbow to title
        title.classList.add('rainbow');
        localStorage.setItem('titleRainbow', 'true');
        
        // Remove any inline custom colors from title spans
        document.querySelectorAll('.title span').forEach(span => {
            span.style.color = '';
            localStorage.removeItem(`titleColor_${span.className.split('-')[1]}`);
        });
        
        // Also add rainbow to project badge
        projectBadge.classList.add('rainbow');
        localStorage.setItem('projectRainbow', 'true');
        projectBadge.style.color = '';
        localStorage.removeItem('projectColor');
    }
}

/**
 * Initialize rainbow effects and colors from localStorage
 */
export function initializeRainbowEffects() {
    const title = document.querySelector('.title');
    const titleApi = document.querySelector('.title-api');
    const titleKey = document.querySelector('.title-key');
    const titleManager = document.querySelector('.title-manager');
    const projectBadge = document.getElementById('selected-project-name');
    
    const titleRainbow = localStorage.getItem('titleRainbow') === 'true';
    const apiRainbow = localStorage.getItem('apiRainbow') === 'true';
    const keyRainbow = localStorage.getItem('keyRainbow') === 'true';
    const managerRainbow = localStorage.getItem('managerRainbow') === 'true';
    const projectRainbow = localStorage.getItem('projectRainbow') === 'true';
    
    // Apply rainbow effects
    if (titleRainbow) {
        // Apply rainbow to entire title
        title.classList.add('rainbow');
        // Clear individual rainbow effects
        titleApi.classList.remove('rainbow');
        titleKey.classList.remove('rainbow');
        titleManager.classList.remove('rainbow');
    } else {
        // Apply individual rainbow effects
        if (apiRainbow) titleApi.classList.add('rainbow');
        if (keyRainbow) titleKey.classList.add('rainbow');
        if (managerRainbow) titleManager.classList.add('rainbow');
        
        // Apply individual colors if not rainbow
        if (!apiRainbow) {
            const apiColor = localStorage.getItem('titleColor_api');
            if (apiColor) titleApi.style.color = apiColor;
        }
        
        if (!keyRainbow) {
            const keyColor = localStorage.getItem('titleColor_key');
            if (keyColor) titleKey.style.color = keyColor;
        }
        
        if (!managerRainbow) {
            const managerColor = localStorage.getItem('titleColor_manager');
            if (managerColor) titleManager.style.color = managerColor;
        }
    }
    
    // Apply project badge effects
    if (projectRainbow) {
        projectBadge.classList.add('rainbow');
    } else {
        const projectColor = localStorage.getItem('projectColor');
        if (projectColor) projectBadge.style.color = projectColor;
    }
    
    // Ensure the title has the expected structure for rainbow animation
    if (title && !title.innerHTML.includes('title-api')) {
        title.innerHTML = 
            '<span class="title-api">API</span> ' +
            '<span class="title-key key-text" onclick="toggleRainbow(event)">Key</span> ' +
            '<span class="title-manager">Manager</span>';
    }
}

// Color picker utility functions
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
