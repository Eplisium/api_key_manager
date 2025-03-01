import { draggedKey, setDraggedKey, draggedKeyRect, setDraggedKeyRect, selectedProject } from '../state/state.js';
import { showNotification } from '../ui/notifications.js';
import { showKeyMoveModal } from '../ui/modals.js';
import { fetchKeys } from './keyManager.js';

/**
 * Handle key drag start event
 * @param {DragEvent} event - The drag start event
 * @param {number} keyId - The ID of the key being dragged
 */
export function handleDragStart(event, keyId) {
    event.stopPropagation();
    setDraggedKey(keyId);
    const keyCard = event.target.closest('.key-card');
    if (!keyCard) return;
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', keyId);
    
    // Store the initial position and dimensions of the dragged card
    setDraggedKeyRect(keyCard.getBoundingClientRect());
    
    // Add dragging styles
    keyCard.classList.add('dragging');
    keyCard.style.opacity = '0.5';
    keyCard.style.transform = 'scale(0.95)';
    
    // Add droppable class to all project items except the current project
    document.querySelectorAll('.project-item').forEach(item => {
        if (item.dataset.projectId != selectedProject) {
            item.classList.add('droppable');
        }
    });
    
    // Add a class to the body to indicate we're dragging a key
    document.body.classList.add('key-dragging');
}

/**
 * Handle key drag end event
 * @param {DragEvent} event - The drag end event
 */
export function handleDragEnd(event) {
    event.stopPropagation();
    const keyCard = event.target.closest('.key-card');
    if (keyCard) {
        keyCard.classList.remove('dragging');
        keyCard.style.opacity = '';
        keyCard.style.transform = '';
    }
    
    // Remove droppable and drag-over classes from all elements
    document.querySelectorAll('.project-item, .key-card').forEach(item => {
        item.classList.remove('droppable');
        item.classList.remove('drag-over');
        item.classList.remove('drag-above');
        item.classList.remove('drag-below');
    });
    
    // Remove the key-dragging class from the body
    document.body.classList.remove('key-dragging');
    
    setDraggedKey(null);
    setDraggedKeyRect(null);
}

/**
 * Handle drag over event
 * @param {DragEvent} event - The drag over event
 */
export function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // If we're dragging over a project item
    const projectItem = event.target.closest('.project-item');
    if (projectItem) {
        // Only show drag-over effect if it's a different project and we're dragging a key
        if (draggedKey && projectItem.dataset.projectId != selectedProject) {
            document.querySelectorAll('.project-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            projectItem.classList.add('drag-over');
        }
        return;
    }
    
    // Handle drag over for key reordering within the same project
    if (!draggedKey) return;
    
    const container = document.getElementById('keys-container');
    const draggingCard = document.querySelector('.key-card.dragging');
    if (!draggingCard) return;
    
    const cards = [...container.querySelectorAll('.key-card:not(.dragging)')];
    if (cards.length === 0) {
        container.appendChild(draggingCard);
        return;
    }
    
    // Remove drag-over classes from all cards first
    cards.forEach(card => {
        card.classList.remove('drag-over');
        card.classList.remove('drag-above');
        card.classList.remove('drag-below');
    });
    
    // Get mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Determine if we're using a grid or list layout
    const containerStyle = window.getComputedStyle(container);
    const isGridLayout = containerStyle.display === 'grid';
    
    // Find the closest card to the mouse position
    let closestCard = null;
    let closestDistance = Infinity;
    let insertPosition = 'before'; // 'before' or 'after'
    
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        // Calculate distance based on layout
        let distance;
        if (isGridLayout) {
            // For grid layout, use 2D distance
            const dx = mouseX - cardCenterX;
            const dy = mouseY - cardCenterY;
            distance = Math.sqrt(dx * dx + dy * dy);
            
            // Determine if we should insert before or after
            if (mouseY < rect.top + (rect.height * 0.5)) {
                insertPosition = 'before';
            } else {
                insertPosition = 'after';
            }
        } else {
            // For list layout, primarily use vertical distance
            distance = Math.abs(mouseY - cardCenterY);
            
            // Determine if we should insert before or after
            if (mouseY < rect.top + (rect.height * 0.5)) {
                insertPosition = 'before';
            } else {
                insertPosition = 'after';
            }
        }
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestCard = card;
        }
    });
    
    if (closestCard) {
        // Add appropriate visual indicator
        if (insertPosition === 'before') {
            closestCard.classList.add('drag-above');
        } else {
            closestCard.classList.add('drag-below');
        }
        
        // Reposition the dragged card
        if (insertPosition === 'before') {
            container.insertBefore(draggingCard, closestCard);
        } else {
            container.insertBefore(draggingCard, closestCard.nextSibling);
        }
    } else {
        // If no closest card found, append to the end
        container.appendChild(draggingCard);
    }
}

/**
 * Handle drop event
 * @param {DragEvent} event - The drop event
 */
export function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove drag-over effects
    document.querySelectorAll('.project-item, .key-card').forEach(item => {
        item.classList.remove('drag-over');
        item.classList.remove('droppable');
        item.classList.remove('drag-above');
        item.classList.remove('drag-below');
    });
    
    // Check if we're dropping on a project item
    const projectItem = event.target.closest('.project-item');
    if (projectItem && draggedKey) {
        const targetProjectId = parseInt(projectItem.dataset.projectId);
        
        // Don't do anything if dropping onto the same project
        if (targetProjectId === selectedProject) {
            return;
        }
        
        // Show move/copy modal
        showKeyMoveModal(draggedKey, targetProjectId);
        return;
    }
    
    // Handle key reordering within the same project
    if (!draggedKey || !selectedProject) return;
    
    const container = document.getElementById('keys-container');
    const droppedCard = document.querySelector(`[data-key-id="${draggedKey}"]`);
    if (!droppedCard) return;
    
    // Get all cards in their current order after the drag operation
    const cards = [...container.querySelectorAll('.key-card')];
    const newPosition = cards.indexOf(droppedCard);
    
    // Only proceed if the position has actually changed
    if (newPosition === -1) return;
    
    // Get the original position before dragging
    const originalPosition = window.keys.findIndex(k => k.id == draggedKey);
    
    // Only proceed if the position has actually changed
    if (originalPosition === newPosition) return;
    
    handleKeyReorder(draggedKey, newPosition, droppedCard);
}

/**
 * Handle key drop on a project
 * @param {DragEvent} event - The drop event
 * @param {string} targetProjectId - The ID of the target project
 */
export async function handleKeyDrop(event, targetProjectId) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the key ID from the dataTransfer
    const keyId = event.dataTransfer.getData('text/plain');
    if (!keyId) return;
    
    // Convert targetProjectId to integer
    targetProjectId = parseInt(targetProjectId);
    
    // Don't do anything if dropping onto the same project
    const key = window.keys.find(k => k.id == keyId);
    if (!key || key.project_id === targetProjectId) {
        return;
    }
    
    // Show the move/copy modal
    showKeyMoveModal(keyId, targetProjectId);
}

/**
 * Handle key reordering
 * @param {number} keyId - The ID of the key to reorder
 * @param {number} newPosition - The new position for the key
 * @param {HTMLElement} droppedCard - The dropped key card element
 */
export async function handleKeyReorder(keyId, newPosition, droppedCard) {
    try {
        // Add loading state
        droppedCard.style.opacity = '0.7';
        droppedCard.style.pointerEvents = 'none';
        
        const response = await fetch(`/keys/${keyId}/reorder`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_position: newPosition,
                project_id: selectedProject
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder key');
        }
        
        // Add success animation
        droppedCard.style.transition = 'all 0.3s ease-in-out';
        droppedCard.style.transform = 'scale(1.02)';
        droppedCard.style.opacity = '1';
        droppedCard.style.boxShadow = '0 0 0 2px var(--primary)';
        
        // Reset the card style after animation
        setTimeout(() => {
            droppedCard.style.transform = '';
            droppedCard.style.boxShadow = '';
            droppedCard.style.pointerEvents = '';
            
            setTimeout(() => {
                droppedCard.style.transition = '';
            }, 600);
        }, 600);
        
        // Update the local keys array to match the new order
        // This helps prevent unnecessary refreshes
        if (window.keys && window.keys.length > 0) {
            const keyToMove = window.keys.find(k => k.id == keyId);
            if (keyToMove) {
                // Remove the key from its current position
                window.keys = window.keys.filter(k => k.id != keyId);
                // Insert it at the new position
                window.keys.splice(newPosition, 0, keyToMove);
            }
        } else {
            // If we don't have the keys array or it's empty, fetch keys
            await fetchKeys();
        }
    } catch (error) {
        console.error('Error reordering key:', error);
        showNotification(error.message, 'error');
        
        // Reset the card style
        droppedCard.style.opacity = '';
        droppedCard.style.pointerEvents = '';
        
        // Refresh to ensure correct order is displayed
        await fetchKeys();
    }
}
