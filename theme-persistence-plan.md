# Theme Persistence Implementation Plan

## Current Issues
1. The HTML file has a hardcoded theme attribute `data-theme="light"` which may override the theme loaded from localStorage
2. Theme initialization timing may need improvement to prevent flash of incorrect theme

## Proposed Changes

### 1. HTML Modifications
- Remove hardcoded theme attribute from HTML tag:
```html
<!-- Change from -->
<html lang="en" data-theme="light">
<!-- To -->
<html lang="en">
```

### 2. Theme Initialization
- Add inline script in head section before any content loads:
```html
<script>
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    // Apply theme immediately to prevent flash
    document.documentElement.setAttribute('data-theme', savedTheme);
</script>
```

### 3. Implementation Steps
1. Modify index.html to remove hardcoded theme
2. Add early theme initialization script
3. Keep existing theme.js functionality for managing theme changes
4. Test theme persistence across page reloads and browser restarts

### 4. Testing Plan
1. Verify theme persists after:
   - Page refresh
   - Browser restart
   - System restart
2. Check no flash of incorrect theme occurs
3. Ensure theme toggle still works properly
4. Verify custom colors and rainbow effects persist

## Implementation Mode
Switch to Code mode to implement these changes.