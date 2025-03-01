// Global state variables
export let isEditMode = false;
export let selectedProject = null;
export let isProjectEditMode = false;
export let draggedKey = null;
export let draggedKeyRect = null;
export let draggedProject = null;
export let projectToDelete = null;

// Context menu state
export let activeProjectId = null;

// Key context menu state
export let activeKeyValue = null;
export let activeKeyId = null;

// Password prompt state
export let currentKeyAction = null;
export let currentKeyData = null;

// Store keys globally for drag and drop operations
export let keys = [];

// Set state functions
export function setIsEditMode(value) {
    isEditMode = value;
}

export function setSelectedProject(value) {
    selectedProject = value;
    localStorage.setItem('selectedProject', value);
}

export function setIsProjectEditMode(value) {
    isProjectEditMode = value;
}

export function setDraggedKey(value) {
    draggedKey = value;
}

export function setDraggedKeyRect(value) {
    draggedKeyRect = value;
}

export function setDraggedProject(value) {
    draggedProject = value;
}

export function setProjectToDelete(value) {
    projectToDelete = value;
}

export function setActiveProjectId(value) {
    activeProjectId = value;
}

export function setActiveKeyValue(value) {
    activeKeyValue = value;
}

export function setActiveKeyId(value) {
    activeKeyId = value;
}

export function setCurrentKeyAction(value) {
    currentKeyAction = value;
}

export function setCurrentKeyData(value) {
    currentKeyData = value;
}

export function setKeys(value) {
    keys = value;
}

// Initialize state from localStorage
export function initializeState() {
    const savedProject = localStorage.getItem('selectedProject');
    if (savedProject) {
        selectedProject = parseInt(savedProject);
    }
}
