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
    
    // Add event listeners for color picker
    document.addEventListener('DOMContentLoaded', () => {
        // Word selection buttons
        document.querySelectorAll('.word-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
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
    });
    
    // Add event listeners for color inputs
    document.getElementById('color-wheel')?.addEventListener('input', (e) => {
        const color = e.target.value;
        document.getElementById('hex-color').value = color.substring(1);
        const rgb = hexToRgb(color);
        document.getElementById('rgb-r').value = rgb.r;
        document.getElementById('rgb-g').value = rgb.g;
        document.getElementById('rgb-b').value = rgb.b;
        updatePreviewColors();
    });

    document.getElementById('hex-color')?.addEventListener('input', (e) => {
        let hex = e.target.value;
        if (hex.length === 6) {
            const color = '#' + hex;
            document.getElementById('color-wheel').value = color;
            const rgb = hexToRgb(color);
            document.getElementById('rgb-r').value = rgb.r;
            document.getElementById('rgb-g').value = rgb.g;
            document.getElementById('rgb-b').value = rgb.b;
            updatePreviewColors();
        }
    });
    
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
        const r = document.getElementById('rgb-r').value;
        const g = document.getElementById('rgb-g').value;
        const b = document.getElementById('rgb-b').value;
        if (r && g && b) {
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
    
    document.getElementById('rgb-r')?.addEventListener('input', handleRgbInput);
    document.getElementById('rgb-g')?.addEventListener('input', handleRgbInput);
    document.getElementById('rgb-b')?.addEventListener('input', handleRgbInput);
    
    // Add right-click handler for the title
    document.querySelector('.title')?.addEventListener('contextmenu', (event) => {
        if (event.shiftKey) {
            event.preventDefault();
            showColorPickerModal(event);
        }
    });
    
    // Add event listener for theme toggle button
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    
    console.log('Initialization complete');
});
