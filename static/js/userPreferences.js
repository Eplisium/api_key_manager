/**
 * User Preferences Module
 * Centralized system for managing user preferences across the application
 */

// Default preferences
const DEFAULT_PREFERENCES = {
    theme: 'light',
    sidebarCollapsed: false,
    selectedProject: null,
    showAllView: true,  // Explicitly track "Show All" view state
    titleColorMode: 'default', // default, solid, rainbow
    titleColorValue: '', // For solid colors
    titleWordColors: { // For individual word colors or rainbow effect
        'api': '',
        'key': '',
        'manager': ''
    },
    colorPickerSettings: {
        selectedWord: 'all',
        selectedOption: 'solid'
    }
};

/**
 * Initialize user preferences from localStorage or use defaults
 * @returns {Object} The initialized preferences
 */
export function initializeUserPreferences() {
    let preferences = {};
    
    try {
        // Try to load existing preferences
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            preferences = JSON.parse(savedPreferences);
            console.log('Loaded user preferences from localStorage');
        } else {
            console.log('No saved preferences found, using defaults');
            preferences = { ...DEFAULT_PREFERENCES };
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
        preferences = { ...DEFAULT_PREFERENCES };
    }
    
    // Ensure all default keys exist (in case new preferences were added)
    preferences = {
        ...DEFAULT_PREFERENCES,
        ...preferences
    };
    
    // Save the complete preferences object
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    return preferences;
}

/**
 * Get a specific user preference
 * @param {string} key - The preference key
 * @param {*} defaultValue - Default value if preference doesn't exist
 * @returns {*} The preference value or default
 */
export function getUserPreference(key, defaultValue = null) {
    try {
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        return key in preferences ? preferences[key] : 
               (key in DEFAULT_PREFERENCES ? DEFAULT_PREFERENCES[key] : defaultValue);
    } catch (error) {
        console.error(`Error getting preference ${key}:`, error);
        return key in DEFAULT_PREFERENCES ? DEFAULT_PREFERENCES[key] : defaultValue;
    }
}

/**
 * Update a specific user preference
 * @param {string} key - The preference key
 * @param {*} value - The new value
 * @returns {Object} The updated preferences object
 */
export function updateUserPreference(key, value) {
    try {
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        
        // Handle nested preferences (using dot notation)
        if (key.includes('.')) {
            const [parentKey, childKey] = key.split('.');
            if (!preferences[parentKey]) {
                preferences[parentKey] = {};
            }
            preferences[parentKey][childKey] = value;
        } else {
            preferences[key] = value;
        }
        
        // Save updated preferences
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        console.log(`Updated preference ${key} to:`, value);
        return preferences;
    } catch (error) {
        console.error(`Error updating preference ${key}:`, error);
        return null;
    }
}

/**
 * Update multiple user preferences at once
 * @param {Object} updates - Object containing key-value pairs to update
 * @returns {Object} The updated preferences object
 */
export function updateMultiplePreferences(updates) {
    try {
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        
        // Apply all updates
        for (const [key, value] of Object.entries(updates)) {
            // Handle nested preferences (using dot notation)
            if (key.includes('.')) {
                const [parentKey, childKey] = key.split('.');
                if (!preferences[parentKey]) {
                    preferences[parentKey] = {};
                }
                preferences[parentKey][childKey] = value;
            } else {
                preferences[key] = value;
            }
        }
        
        // Save updated preferences
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        console.log('Updated multiple preferences:', updates);
        return preferences;
    } catch (error) {
        console.error('Error updating multiple preferences:', error);
        return null;
    }
}

/**
 * Reset all user preferences to defaults
 * @returns {Object} The default preferences
 */
export function resetUserPreferences() {
    try {
        localStorage.setItem('userPreferences', JSON.stringify(DEFAULT_PREFERENCES));
        console.log('Reset all preferences to defaults');
        return { ...DEFAULT_PREFERENCES };
    } catch (error) {
        console.error('Error resetting preferences:', error);
        return null;
    }
}

/**
 * Get the complete preferences object
 * @returns {Object} The full preferences object
 */
export function getAllPreferences() {
    try {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
    } catch (error) {
        console.error('Error getting all preferences:', error);
        return { ...DEFAULT_PREFERENCES };
    }
}

/**
 * Track the "Show All" view state explicitly
 * @param {boolean} enabled - Whether "Show All" view is enabled
 */
export function setShowAllViewState(enabled) {
    updateUserPreference('showAllView', enabled);
    if (enabled) {
        // When enabling "Show All" view, clear the selected project
        updateUserPreference('selectedProject', null);
    }
}

/**
 * Check if "Show All" view is currently active
 * @returns {boolean} Whether "Show All" view is active
 */
export function isShowAllViewActive() {
    return getUserPreference('showAllView', true);
}
