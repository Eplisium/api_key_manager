// Import state management
import { initializeState } from './state/state.js';

// Import UI components
import { showNotification } from './ui/notifications.js';
import { setTheme, toggleTheme, initializeTheme, initializeSidebar, toggleSidebar, toggleRainbow, initializeRainbowEffects } from './ui/theme.js';
import { 
    showContextMenu, hideContextMenu, editProjectFromMenu, deleteProjectFromMenu,
    showKeyContextMenu, hideKeyContextMenu, copyKeyFromMenu, handlePasswordKeyDown, viewEncryptedKey
} from './ui/contextMenu.js';
import {
    showProjectModal, hideProjectModal, showAddModal, hideModal,
    showDeleteKeyModal, hideDeleteKeyModal, showDeleteProjectModal, hideDeleteProjectModal,
    showPasswordPrompt, hidePasswordPrompt, handlePasswordSubmit, performEdit,
    showKeyMoveModal, hideKeyMoveModal, executeKeyMove,
    showPostImportModal, hidePostImportModal,
    showEncryptionModal, hideEncryptionModal, showEncryptionStatus, hideEncryptionStatusModal,
    showImportDBModal, hideImportDBModal,
    confirmClearAllKeys, hideClearKeysModal,
    showColorPickerModal, hideColorPickerModal, initializeColorPicker, updatePreviewColors,
    updatePreviewBackground, applyCustomColor, resetTitleColor
} from './ui/modals.js';

// Import project management
import { 
    fetchProjects, renderProjects, updateProjectSelect, selectProject, showAllKeys,
    editProject, deleteProject, executeProjectDelete, handleProjectSubmit
} from './projects/projectManager.js';
import {
    handleProjectDragStart, handleProjectDragOver, handleProjectDragEnd, handleProjectDrop
} from './projects/projectDragDrop.js';

// Import key management
import {
    fetchKeys, renderKeys, editKey, deleteKey, executeKeyDelete,
    copyToClipboard, handleFormSubmit, updateKey, refreshKeyCard
} from './keys/keyManager.js';
import {
    handleDragStart, handleDragEnd, handleDragOver, handleDrop, handleKeyDrop, handleKeyReorder
} from './keys/keyDragDrop.js';
import { performKeyMove } from './keys/keyMove.js';
import { handleEncryption, performExport } from './keys/encryption.js';

// Import import/export functionality
import {
    handleEnvFileUpload, importFromOS, exportKeys, toggleExportDropdown, toggleImportDropdown,
    applyBulkUsedWith, applyBulkDescription, clearAllDescriptions, toggleAllKeys,
    removeUnselectedKeys, saveImportedKeysConfig, confirmClearAllKeys as confirmClearKeys,
    executeClearAllKeys
} from './import-export/importExport.js';

// Import database management
import {
    downloadDatabase, toggleManageDBDropdown, handleDBImport
} from './database/databaseManager.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    
    // Initialize state
    initializeState();
    
    // Initialize theme and UI
    initializeTheme();
    initializeSidebar();
    initializeRainbowEffects();
    
    // Fetch initial data
    await fetchProjects();
    
    // Restore selected project from localStorage
    const savedProject = localStorage.getItem('selectedProject');
    if (savedProject) {
        selectProject(parseInt(savedProject));
    } else {
        await fetchKeys();
    }
    
    // Expose functions to the global scope for inline event handlers
    // State management
    window.selectedProject = null; // This will be updated by selectProject
    
    // UI functions
    window.setTheme = setTheme;
    window.toggleTheme = toggleTheme;
    window.toggleSidebar = toggleSidebar;
    window.toggleRainbow = toggleRainbow;
    window.showNotification = showNotification;
    
    // Context menu functions
    window.showContextMenu = showContextMenu;
    window.hideContextMenu = hideContextMenu;
    window.editProjectFromMenu = editProjectFromMenu;
    window.deleteProjectFromMenu = deleteProjectFromMenu;
    window.showKeyContextMenu = showKeyContextMenu;
    window.hideKeyContextMenu = hideKeyContextMenu;
    window.copyKeyFromMenu = copyKeyFromMenu;
    window.handlePasswordKeyDown = handlePasswordKeyDown;
    window.viewEncryptedKey = viewEncryptedKey;
    
    // Modal functions
    window.showProjectModal = showProjectModal;
    window.hideProjectModal = hideProjectModal;
    window.showAddModal = showAddModal;
    window.hideModal = hideModal;
    window.showDeleteKeyModal = showDeleteKeyModal;
    window.hideDeleteKeyModal = hideDeleteKeyModal;
    window.showDeleteProjectModal = showDeleteProjectModal;
    window.hideDeleteProjectModal = hideDeleteProjectModal;
    window.showPasswordPrompt = showPasswordPrompt;
    window.hidePasswordPrompt = hidePasswordPrompt;
    window.handlePasswordSubmit = handlePasswordSubmit;
    window.showKeyMoveModal = showKeyMoveModal;
    window.hideKeyMoveModal = hideKeyMoveModal;
    window.executeKeyMove = executeKeyMove;
    window.showEncryptionModal = showEncryptionModal;
    window.hideEncryptionModal = hideEncryptionModal;
    window.showEncryptionStatus = showEncryptionStatus;
    window.hideEncryptionStatusModal = hideEncryptionStatusModal;
    window.showImportDBModal = showImportDBModal;
    window.hideImportDBModal = hideImportDBModal;
    window.confirmClearAllKeys = confirmClearKeys;
    window.hideClearKeysModal = hideClearKeysModal;
    window.showColorPickerModal = showColorPickerModal;
    window.hideColorPickerModal = hideColorPickerModal;
    window.initializeColorPicker = initializeColorPicker;
    window.updatePreviewColors = updatePreviewColors;
    window.updatePreviewBackground = updatePreviewBackground;
    window.applyCustomColor = applyCustomColor;
    window.resetTitleColor = resetTitleColor;
    
    // Project management functions
    window.fetchProjects = fetchProjects;
    window.selectProject = selectProject;
    window.showAllKeys = showAllKeys;
    window.editProject = editProject;
    window.deleteProject = deleteProject;
    window.executeProjectDelete = executeProjectDelete;
    window.handleProjectSubmit = handleProjectSubmit;
    
    // Project drag and drop functions
    window.handleProjectDragStart = handleProjectDragStart;
    window.handleProjectDragOver = handleProjectDragOver;
    window.handleProjectDragEnd = handleProjectDragEnd;
    window.handleProjectDrop = handleProjectDrop;
    
    // Key management functions
    window.fetchKeys = fetchKeys;
    window.editKey = editKey;
    window.deleteKey = deleteKey;
    window.executeKeyDelete = executeKeyDelete;
    window.copyToClipboard = copyToClipboard;
    window.handleFormSubmit = handleFormSubmit;
    window.refreshKeyCard = refreshKeyCard;
    
    // Key drag and drop functions
    window.handleDragStart = handleDragStart;
    window.handleDragEnd = handleDragEnd;
    window.handleDragOver = handleDragOver;
    window.handleDrop = handleDrop;
    window.handleKeyDrop = handleKeyDrop;
    window.handleKeyReorder = handleKeyReorder;
    
    // Encryption functions
    window.handleEncryption = handleEncryption;
    window.performExport = performExport;
    
    // Import/export functions
    window.handleEnvFileUpload = handleEnvFileUpload;
    window.importFromOS = importFromOS;
    window.exportKeys = exportKeys;
    window.toggleExportDropdown = toggleExportDropdown;
    window.toggleImportDropdown = toggleImportDropdown;
    window.applyBulkUsedWith = applyBulkUsedWith;
    window.applyBulkDescription = applyBulkDescription;
    window.clearAllDescriptions = clearAllDescriptions;
    window.toggleAllKeys = toggleAllKeys;
    window.removeUnselectedKeys = removeUnselectedKeys;
    window.saveImportedKeysConfig = saveImportedKeysConfig;
    window.executeClearAllKeys = executeClearAllKeys;
    
    // Database management functions
    window.downloadDatabase = downloadDatabase;
    window.toggleManageDBDropdown = toggleManageDBDropdown;
    window.handleDBImport = handleDBImport;
    
    // Global variables needed for some functions
    window.allKeysSelected = true;
    window.currentKeyAction = null;
    window.currentKeyData = null;
    window.keyToDelete = null;
    window.projectToDelete = null;
    window.selectedWord = 'all';
    window.selectedColorOption = 'solid';
    
    // Handle mouse events on the key overlay element
    window.handleKeyMouseDown = function(event) {
        console.log('Key mouse down event:', event.button, event.shiftKey);
        
        // Always prevent default event behavior to avoid context menu
        event.preventDefault();
        event.stopPropagation();
        
        // Handle shift+right-click (open color picker)
        if (event.shiftKey && event.button === 2) {
            console.log('Shift+right-click detected on key, opening color picker');
            setTimeout(() => {
                showColorPickerModal(event);
            }, 10);
            return false;
        }
        
        // Handle shift+left-click (toggle rainbow effect)
        if (event.shiftKey && event.button === 0) {
            console.log('Shift+left-click detected on key, toggling rainbow');
            toggleRainbow(event);
            return false;
        }
        
        return false;
    };
    
    // Add event listeners for dropdowns
    window.onclick = function(event) {
        if (!event.target.matches('.btn-secondary')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    };
    
    // Add global event listener for right-click on title-key element
    document.addEventListener('contextmenu', function(event) {
        console.log('Global contextmenu handler triggered');
        
        // Check if the click is on or within the title-key element
        const titleKeyElement = document.querySelector('.title-key');
        if (titleKeyElement && (event.target === titleKeyElement || titleKeyElement.contains(event.target))) {
            console.log('Right-click on title-key element detected');
            
            // Always prevent default for right-clicks on title-key
            event.preventDefault();
            event.stopPropagation();
            
            // Only show color picker if shift key is pressed
            if (event.shiftKey) {
                console.log('Shift key is pressed during right-click');
                setTimeout(() => {
                    showColorPickerModal(event);
                }, 10);
            }
            return false;
        }
        
        // Check if shift key is pressed for other elements
        if (event.shiftKey) {
            console.log('Shift key is pressed during right-click');
            
            // Check if the click is on or within the title element
            const titleElement = document.querySelector('.title');
            if (titleElement && (event.target === titleElement || titleElement.contains(event.target))) {
                console.log('Right-click on title element detected with shift key');
                event.preventDefault();
                event.stopPropagation();
                
                // Call showColorPickerModal directly
                showColorPickerModal(event);
                return false;
            }
        }
    }, true); // Use capturing phase to ensure our handler runs first
    
    // Simplify with a direct handler using mousedown for better detection
    const titleElement = document.querySelector('.title');
    const titleKeyElement = document.querySelector('.title-key');
    
    // Add specific event listener for the title-key element
    if (titleKeyElement) {
        // Prevent context menu on title-key regardless of shift key
        titleKeyElement.addEventListener('contextmenu', function(event) {
            console.log('Direct contextmenu handler on title-key triggered');
            event.preventDefault();
            event.stopPropagation();
            
            // Only show color picker if shift key is pressed
            if (event.shiftKey) {
                setTimeout(() => {
                    showColorPickerModal(event);
                }, 10);
            }
            return false;
        }, false);
        
        titleKeyElement.addEventListener('mousedown', function(event) {
            // Right mouse button (button 2)
            if (event.button === 2) {
                console.log('mousedown: Right button detected on title-key');
                event.preventDefault();
                event.stopPropagation();
                
                // Show the color picker if shift key is pressed
                if (event.shiftKey) {
                    setTimeout(() => {
                        showColorPickerModal(event);
                    }, 10);
                }
                return false;
            }
        }, true);
    }
    
    if (titleElement) {
        titleElement.addEventListener('mousedown', function(event) {
            // Check if it's a right-click (button 2) with shift key pressed
            if (event.button === 2 && event.shiftKey) {
                console.log('mousedown: Right button + shift detected on title');
                event.preventDefault();
                event.stopPropagation();
                
                // Show the color picker
                setTimeout(() => {
                    showColorPickerModal(event);
                }, 10);
                return false;
            }
        }, true);
    }
    
    // Add event listeners for color picker - directly attach them without nesting in another DOMContentLoaded
    // Word selection buttons
    const setupColorPickerEventListeners = () => {
        console.log('Setting up color picker event listeners');
        
        document.querySelectorAll('.word-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Word select button clicked:', btn.dataset.word);
                document.querySelectorAll('.word-select-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.selectedWord = btn.dataset.word;
                
                // Update preview with current colors
                updatePreviewColors();
            });
        });
        
        // Color option buttons
        document.querySelectorAll('.color-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Color option button clicked:', btn.dataset.option);
                document.querySelectorAll('.color-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.selectedColorOption = btn.dataset.option;
                
                if (window.selectedColorOption === 'rainbow') {
                    // Hide color picker controls when rainbow is selected
                    document.getElementById('color-picker-controls').style.display = 'none';
                    document.getElementById('hex-color').parentElement.parentElement.style.display = 'none';
                    document.getElementById('rgb-r').parentElement.parentElement.parentElement.style.display = 'none';
                    
                    // Update preview to show rainbow
                    document.querySelector('.preview-text').classList.add('rainbow');
                } else {
                    // Show color picker controls when solid color is selected
                    document.getElementById('color-picker-controls').style.display = 'block';
                    document.getElementById('hex-color').parentElement.parentElement.style.display = 'block';
                    document.getElementById('rgb-r').parentElement.parentElement.parentElement.style.display = 'block';
                    
                    // Update preview to show solid color
                    const previewText = document.querySelector('.preview-text');
                    previewText.classList.remove('rainbow');
                    updatePreviewColors();
                }
            });
        });
        
        // Preview background selector
        document.getElementById('preview-background')?.addEventListener('change', updatePreviewBackground);
    };
    
    // Call the setup function directly
    setupColorPickerEventListeners();
    
    // Also set up a mutation observer to handle dynamically loaded color picker elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && 
                mutation.addedNodes.length && 
                document.getElementById('color-picker-modal')?.classList.contains('show')) {
                setupColorPickerEventListeners();
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add a final global window-level handler for context menu events
    window.addEventListener('contextmenu', function(event) {
        // Check for key-overlay element first
        if (event.target && (event.target.classList.contains('key-overlay') ||
            event.target.closest('.key-overlay'))) {
            console.log('Prevented context menu on key-overlay');
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        // Get the target element and check if it's the title-key or a child of it
        const titleKeyElement = document.querySelector('.title-key');
        if (titleKeyElement && (event.target === titleKeyElement || titleKeyElement.contains(event.target))) {
            console.log('Window-level contextmenu handler prevented default for title-key');
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);
    
    // Add a specific handler to prevent context menu on the overlay
    document.addEventListener('DOMContentLoaded', function() {
        const keyOverlay = document.querySelector('.key-overlay');
        if (keyOverlay) {
            keyOverlay.addEventListener('contextmenu', function(event) {
                console.log('Prevented context menu on key-overlay element');
                event.preventDefault();
                event.stopPropagation();
                return false;
            }, true);
            
            // Add handlers for all relevant mouse events
            ['mousedown', 'mouseup', 'click', 'auxclick', 'pointerdown'].forEach(eventType => {
                keyOverlay.addEventListener(eventType, function(event) {
                    if (event.button === 2 || (event.shiftKey && event.button === 2)) {
                        console.log(`Prevented ${eventType} event with button ${event.button} on key-overlay`);
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // Trigger color picker on shift+right-click
                        if (event.shiftKey && event.button === 2 && eventType === 'mousedown') {
                            colorPickerModal.style.display = 'block';
                            colorPickerTarget = 'rainbow';
                        }
                        
                        return false;
                    }
                }, true);
            });
        }
    });
    
    // Set up color input event listeners
    const setupColorInputEventListeners = () => {
        console.log('Setting up color input event listeners');
        
        // Color wheel input
        const colorWheel = document.getElementById('color-wheel');
        if (colorWheel) {
            colorWheel.addEventListener('input', (e) => {
                console.log('Color wheel changed:', e.target.value);
                const color = e.target.value;
                document.getElementById('hex-color').value = color.substring(1);
                const rgb = hexToRgb(color);
                document.getElementById('rgb-r').value = rgb.r;
                document.getElementById('rgb-g').value = rgb.g;
                document.getElementById('rgb-b').value = rgb.b;
                updatePreviewColors();
            });
        }

        // Hex input
        const hexInput = document.getElementById('hex-color');
        if (hexInput) {
            hexInput.addEventListener('input', (e) => {
                let hex = e.target.value;
                if (hex.length === 6) {
                    console.log('Hex color changed:', hex);
                    const color = '#' + hex;
                    document.getElementById('color-wheel').value = color;
                    const rgb = hexToRgb(color);
                    document.getElementById('rgb-r').value = rgb.r;
                    document.getElementById('rgb-g').value = rgb.g;
                    document.getElementById('rgb-b').value = rgb.b;
                    updatePreviewColors();
                }
            });
        }
        
        // RGB inputs
        const rgbR = document.getElementById('rgb-r');
        const rgbG = document.getElementById('rgb-g');
        const rgbB = document.getElementById('rgb-b');
        
        if (rgbR) rgbR.addEventListener('input', handleRgbInput);
        if (rgbG) rgbG.addEventListener('input', handleRgbInput);
        if (rgbB) rgbB.addEventListener('input', handleRgbInput);
    };
    
    // Call the setup function directly
    setupColorInputEventListeners();
    
    // Helper function for color picker
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    function handleRgbInput() {
        const r = document.getElementById('rgb-r')?.value;
        const g = document.getElementById('rgb-g')?.value;
        const b = document.getElementById('rgb-b')?.value;
        if (r && g && b) {
            console.log('RGB values changed:', r, g, b);
            const color = rgbToHex(Number(r), Number(g), Number(b));
            document.getElementById('color-wheel').value = color;
            document.getElementById('hex-color').value = color.substring(1);
            updatePreviewColors();
        }
    }
    
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    // Add event listener for theme toggle button
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    
    console.log('Initialization complete');
});
