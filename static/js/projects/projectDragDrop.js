import { draggedProject, setDraggedProject } from '../state/state.js';
import { showNotification } from '../ui/notifications.js';
import { fetchProjects } from './projectManager.js';

/**
 * Handle project drag start event
 * @param {DragEvent} event - The drag start event
 * @param {number} projectId - The ID of the project being dragged
 */
export function handleProjectDragStart(event, projectId) {
    event.stopPropagation();
    setDraggedProject(projectId);
    
    // Create a custom drag image that looks like the project item
    const draggedElement = event.currentTarget;
    
    // Set data transfer properties
    event.dataTransfer.setData('text/plain', projectId);
    event.dataTransfer.effectAllowed = 'move';
    
    // Add visual classes
    draggedElement.classList.add('dragging');
    
    // Add a dragging class to the body to help with styling
    document.body.classList.add('project-dragging');
    
    // Remove any existing drag-over classes
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    // Add a subtle transition effect to all projects
    document.querySelectorAll('.project-item:not(.dragging)').forEach(item => {
        item.style.transition = 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out';
        item.style.opacity = '0.8';
    });
}

/**
 * Handle project drag over event
 * @param {DragEvent} event - The drag over event
 */
export function handleProjectDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Only handle if we're dragging a project
    if (!draggedProject) return;
    
    const projectItem = event.currentTarget;
    if (!projectItem.classList.contains('project-item')) return;
    
    const draggedElement = document.querySelector(`[data-project-id="${draggedProject}"]`);
    if (!draggedElement) return;
    
    const draggedPos = parseInt(draggedElement.dataset.position);
    const targetPos = parseInt(projectItem.dataset.position);
    
    // Only show drag-over effect if positions are different
    if (draggedPos !== targetPos) {
        // Remove drag-over class from all other items
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.remove('drag-over');
            item.classList.remove('drag-above');
            item.classList.remove('drag-below');
        });
        
        // Add appropriate class based on relative position
        projectItem.classList.add('drag-over');
        
        // Add a class to indicate whether the dragged item will go above or below
        if (draggedPos > targetPos) {
            projectItem.classList.add('drag-above');
        } else {
            projectItem.classList.add('drag-below');
        }
    }
}

/**
 * Handle project drag end event
 * @param {DragEvent} event - The drag end event
 */
export function handleProjectDragEnd(event) {
    event.stopPropagation();
    
    // Clean up all drag-related classes
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
        item.classList.remove('drag-above');
        item.classList.remove('drag-below');
        item.style.transition = '';
        item.style.opacity = '';
    });
    
    document.body.classList.remove('project-dragging');
    setDraggedProject(null);
}

/**
 * Handle project drop event
 * @param {DragEvent} event - The drop event
 */
export async function handleProjectDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // If we're not dragging a project, let the key drop handler take over
    if (!draggedProject) return;
    
    const projectItem = event.currentTarget;
    if (!projectItem.classList.contains('project-item')) return;
    
    // Clean up drag effects
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('drag-over');
        item.classList.remove('drag-above');
        item.classList.remove('drag-below');
    });
    document.body.classList.remove('project-dragging');
    
    const targetProjectId = parseInt(projectItem.dataset.projectId);
    const sourceProjectId = draggedProject;
    
    if (sourceProjectId === targetProjectId) {
        setDraggedProject(null);
        return;
    }
    
    try {
        const targetPosition = parseInt(projectItem.dataset.position);
        
        // Add loading state to source project
        const sourceProject = document.querySelector(`[data-project-id="${sourceProjectId}"]`);
        if (sourceProject) {
            sourceProject.style.opacity = '0.5';
            sourceProject.style.pointerEvents = 'none';
            sourceProject.classList.add('reordering');
        }
        
        // Add loading state to target project
        projectItem.classList.add('target-highlight');
        
        const response = await fetch(`/projects/${sourceProjectId}/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_position: targetPosition })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder project');
        }
        
        // Refresh projects after successful reorder
        await fetchProjects();
        showNotification('Project order updated', 'success');
    } catch (error) {
        console.error('Error reordering project:', error);
        showNotification(error.message, 'error');
        
        // Reset the source project style if it exists
        const sourceProject = document.querySelector(`[data-project-id="${sourceProjectId}"]`);
        if (sourceProject) {
            sourceProject.style.opacity = '';
            sourceProject.style.pointerEvents = '';
            sourceProject.classList.remove('reordering');
        }
        
        // Reset the target project style
        projectItem.classList.remove('target-highlight');
    } finally {
        setDraggedProject(null);
    }
}
