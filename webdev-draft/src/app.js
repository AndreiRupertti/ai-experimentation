/**
 * React Component Canvas - Development Planner
 * 
 * This file has been organized to reduce code duplication and improve maintainability:
 * 
 * CONSTANTS:
 * - COLORS: Centralized VS Code theme colors
 * - FONTS: Standardized font configurations  
 * - LAYOUT: Layout constants and measurements
 * - CURSORS: Cursor type definitions
 * 
 * UTILITY FUNCTIONS:
 * - Cursor management utilities
 * - Connection management utilities  
 * - Component creation utilities
 * - Drawing utilities (gradients, borders, shadows)
 * - JSX rendering utilities (tags, props, brackets)
 * 
 * This organization eliminates hardcoded values and reduces code duplication
 * while maintaining the exact same functionality.
 */

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// ----------- Constants -------------

// VS Code Theme Colors
const COLORS = {
  // Component gradients
  COMPONENT_START: "#2d3142",
  COMPONENT_END: "#1e1e2e",

  // Event box colors
  HOOK_START: "#E7DE79",
  HOOK_END: "#E7DE78",
  TRIGGER_START: "#FF79C6",
  TRIGGER_END: "#FF79C7",

  // Text colors
  KEYWORD_BLUE: "#569cd6",
  TYPE_TEAL: "#4ec9b0",
  PARAMETER_BLUE: "#9cdcfe",
  STRING_ORANGE: "#ce9178",
  INNER_HTML_GRAY: "#888888",
  COMMENT_GREEN: "#6a9955",
  FUNCTION_YELLOW: "#dcdcaa",
  LIGHT_TEXT: "#cccccc",

  // Border colors
  SELECTED_BLUE: "#007acc",
  SELECTED_CHILD: "#00d4ff",
  MULTI_SELECTED: "#ff4444", // Red color for multi-selection
  HOVER_BLUE: "#569cd6",
  HOVER_TOP_LEVEL: "#4a9eff",
  NORMAL_GRAY: "#3c3c3c",

  // UI colors
  DROP_TARGET: "#00ff88",
  SHADOW: "rgba(0, 0, 0, 0.3)",
  SELECTION_AREA: "rgba(100, 149, 237, 0.2)", // Semi-transparent blue for selection area
  SELECTION_AREA_BORDER: "#6495ed", // Cornflower blue for selection area border

  // Highlight types for drawHighlightBox
  SELECTION: "selection",
  HOVER: "hover",
};

// Font configurations
const FONTS = {
  CODE: "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace",
  CODE_SMALL: "12px 'Fira Code', 'Monaco', 'Menlo', monospace",
  CODE_TINY: "11px 'Fira Code', 'Monaco', 'Menlo', monospace",
  COMMENT: "bold 12px 'Fira Code', sans-serif",
  EVENT_TITLE: "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace",
  EVENT_DESCRIPTION: "12px  'Fira Code', 'Monaco', 'Menlo', monospace",
  TOGGLE: "bold 16px sans-serif",
  TYPE_INDICATOR: "10px sans-serif",
};

// Layout constants
const LAYOUT = {
  MIN_COMPONENT_WIDTH: 200,
  DEFAULT_COMPONENT_WIDTH: 160,
  DEFAULT_COMPONENT_HEIGHT: 40,
  PADDING_BASE: 4,
  PADDING_LEVEL_MULTIPLIER: 20,
  CHILD_PADDING: 30,
  BORDER_RADIUS: 8,
  SHADOW_OFFSET: 2,
  LINE_HEIGHT: {
    PROP: 20,
    INNER_HTML: 16,
    INNER_HTML_EMPTY: 12,
    HOOK: 14,
    CHILD: 25
  },
  TOGGLE_AREA: {
    x: 8, y: 8, w: 20, h: 20
  },
  // JSX Rendering constants
  JSX: {
    TAG_INDENT: 20,           // Standard indentation for JSX tags
    TAG_VERTICAL_OFFSET: 30,  // Vertical offset for tag positioning
    TAG_VERTICAL_OFFSET_SELF_CLOSING: 40,  // Vertical offset for tag positioning
    BRACKET_OFFSET: 29,       // Offset for JSX brackets after '<'
    CLOSING_TAG_OFFSET: 38,   // Offset for closing tag text
    CHAR_WIDTH: 10,           // Approximate character width for monospace font
    PROP_SPACING: 5,          // Extra spacing for props
    SIMPLE_TAG_RETURN: 15,    // Return value for simple tags
    COMPONENT_NAME_SPACING: 9, // Spacing for component name after '<'
    CONTENT_INDENT: 25,       // Indentation for content inside components
    HOOK_INDENT: 35,          // Indentation for hook items
    CLOSING_BRACKET_OFFSET: 18, // Offset for closing bracket
    CHILD_INDENT_STEP: 20     // Step size for child indentation
  },
  // Component display constants
  COMPONENT: {
    TOGGLE_Y_OFFSET: 25,      // Y offset for toggle symbol
    TYPE_INDICATOR_X_OFFSET: 70, // X offset from right edge for type indicator
    EVENT_TITLE_X_OFFSET: 10, // X offset for event box title
    EVENT_TITLE_Y_OFFSET: 25, // Y offset for event box title
    EVENT_DESC_Y_OFFSET: 45,  // Y offset for event box description
    NAME_CHAR_WIDTH: 12,      // Character width for component name calculation
    NAME_BASE_WIDTH: 60,      // Base width added to name length
    HEADER_HEIGHT: 60,        // Header height for components
    CLOSING_TAG_SPACING: 40,  // Spacing for closing tag
    PROP_WIDTH_PADDING: 100,  // Padding added to prop width calculations
    CHILD_WIDTH_MARGIN: 200   // Margin added to child width (was 10, user changed to 200)
  },
  // Child JSX rendering constants (for drawChildrenAsJSX function)
  CHILD_JSX: {
    OFFSET_Y_STEP: 20,        // Standard Y offset step for child elements
    OFFSET_Y_LARGE_STEP: 25,  // Larger Y offset step for closing elements
    Y_POSITION_OFFSET: 18,    // Y position offset for child hit detection
    WIDTH_PADDING: 100,       // Width padding for child components
    NESTED_INDENT_STEP: 20,   // Indentation step for nested children
    CLOSING_BRACKET_X_OFFSET: 18, // X offset for closing bracket in nested children
    SIMPLE_CLOSING_X_OFFSET: 9    // X offset for simple closing tags
  },
  // Drag indicator constants
  DRAG: {
    MIN_WIDTH: 150,           // Minimum width for drag indicator
    HEIGHT: 35,               // Height for drag indicator
    NAME_WIDTH_MULTIPLIER: 10, // Multiplier for name length in width calc
    BASE_WIDTH_PADDING: 40,   // Base padding for drag indicator width
    SHADOW_OFFSET: 3,         // Shadow offset for drag indicator
    TEXT_Y_OFFSET: 22,        // Y offset for text in drag indicator
    ICON_X_OFFSET: 20,        // X offset from right for drag icon
    ICON_Y_OFFSET: 20,        // Y offset for drag icon
    COMPONENT_NAME_X_OFFSET: 19 // X offset for component name in drag indicator
  }
};

// Cursor types
const CURSORS = {
  DEFAULT: 'default',
  POINTER: 'pointer',
  GRAB: 'grab',
  GRABBING: 'grabbing',
  CROSSHAIR: 'crosshair'
};

// Component types for React development
const COMPONENT_TYPES = {
  COMPONENT: 'Component',
  PROVIDER: 'Provider',
  HOOK: 'Hook'
};

// Common React patterns
const REACT_PATTERNS = {
  CONTAINER: 'Container',
  PRESENTATIONAL: 'Presentational',
  HOC: 'HOC',
  RENDER_PROP: 'Render Prop'
};

// ----------- State Variables -------------

// Set canvas size properly
function resizeCanvas() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set the display size to fill the container
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // Set the actual size in memory
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// Initialize canvas size
resizeCanvas();

// Resize canvas when window resizes
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

let files = [];
let draggingFile = null;
let currentDropTarget = null;
let offsetX = 0,
  offsetY = 0;
let selectedFile = null;
let selectedChild = null; // Track selected child components separately
let hoveredFile = null; // Track hovered component for cursor changes

// Multi-selection state
let multiSelectedFiles = []; // Array to store multiple selected components
let isAreaSelecting = false; // Flag for area selection mode
let selectionAreaStart = { x: 0, y: 0 }; // Starting point of selection area
let selectionAreaEnd = { x: 0, y: 0 }; // End point of selection area

// Connection arrows system
let connections = []; // Array to store all connections
let isConnecting = false; // Flag for connection mode
let connectionStart = null; // Starting component for connection
let tempConnectionEnd = { x: 0, y: 0 }; // Temporary end point while dragging
let selectedConnection = null; // Selected connection for deletion
let hoveredConnection = null; // Hovered connection for visual feedback

// Undo functionality
let history = [];
let maxHistorySize = 30;

// Load initial state - URL has priority over localStorage
const initiallyLoadedFromURL = loadFromURL(); // Try to load from URL first
if (!initiallyLoadedFromURL) {
  loadFromLocalStorage(); // Fall back to localStorage if no URL state
}

// Flag to prevent URL updates only during the initial load
let isInitialLoad = initiallyLoadedFromURL;

// Initial draw
draw();

// After the initial draw, allow URL updates on all subsequent changes
setTimeout(() => {
  isInitialLoad = false;
}, 100);

// ----------- Utility Functions -------------

// Cursor management utilities
function setCursor(cursorType) {
  canvas.style.cursor = cursorType;
}

function updateCursorForComponent(component, isSelected) {
  if (!component) {
    setCursor(isConnecting ? CURSORS.CROSSHAIR : CURSORS.DEFAULT);
    return;
  }

  const isTopLevel = files.includes(component);
  
  if (isConnecting) {
    setCursor(CURSORS.CROSSHAIR);
  } else if (isTopLevel) {
    setCursor(CURSORS.GRAB);
  } else if (isSelected) {
    setCursor(CURSORS.GRAB);
  } else {
    setCursor(CURSORS.POINTER);
  }
}

// Multi-selection utilities
function clearSelection() {
  selectedFile = null;
  selectedChild = null;
  multiSelectedFiles = [];
}

function isComponentSelected(component) {
  return selectedFile === component || multiSelectedFiles.includes(component);
}

function addToMultiSelection(component) {
  if (!multiSelectedFiles.includes(component)) {
    multiSelectedFiles.push(component);
  }
  // Clear single selection when using multi-selection
  selectedFile = null;
  selectedChild = null;
}

function removeFromMultiSelection(component) {
  const index = multiSelectedFiles.indexOf(component);
  if (index !== -1) {
    multiSelectedFiles.splice(index, 1);
  }
}

function isInSelectionArea(component, startX, startY, endX, endY) {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);
  
  // Check if component overlaps with selection area
  return !(component.x + component.w < minX || 
           component.x > maxX || 
           component.y + component.h < minY || 
           component.y > maxY);
}

function selectComponentsInArea(components, startX, startY, endX, endY) {
  const selectedComponents = [];
  
  function checkComponent(component) {
    if (isInSelectionArea(component, startX, startY, endX, endY)) {
      selectedComponents.push(component);
    }
    
    // Check children recursively
    if (component.children) {
      component.children.forEach(child => checkComponent(child));
    }
  }
  
  components.forEach(component => checkComponent(component));
  return selectedComponents;
}

function drawSelectionArea() {
  if (!isAreaSelecting) return;
  
  const minX = Math.min(selectionAreaStart.x, selectionAreaEnd.x);
  const minY = Math.min(selectionAreaStart.y, selectionAreaEnd.y);
  const width = Math.abs(selectionAreaEnd.x - selectionAreaStart.x);
  const height = Math.abs(selectionAreaEnd.y - selectionAreaStart.y);
  
  // Draw selection area background
  ctx.fillStyle = COLORS.SELECTION_AREA;
  ctx.fillRect(minX, minY, width, height);
  
  // Draw selection area border
  ctx.strokeStyle = COLORS.SELECTION_AREA_BORDER;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(minX, minY, width, height);
  ctx.setLineDash([]);
}
function resetConnectionMode() {
  connectionStart = null;
  isConnecting = false;
  setCursor(CURSORS.DEFAULT);
  
  const connectionBtn = document.getElementById("connectBtn");
  if (connectionBtn) {
    connectionBtn.classList.remove('active');
    connectionBtn.style.background = '';
    connectionBtn.style.color = '';
  }
}

function connectionExists(from, to) {
  return connections.find(conn => 
    (conn.from === from && conn.to === to) ||
    (conn.from === to && conn.to === from)
  );
}

function createConnection(from, to) {
  return {
    id: Date.now(),
    from: from,
    to: to,
    fromPoint: getConnectionPoint(from, to),
    toPoint: getConnectionPoint(to, from)
  };
}

// Component creation utilities
function createNewComponent(name, x, y) {
  return {
    name,
    x,
    y,
    w: LAYOUT.DEFAULT_COMPONENT_WIDTH,
    h: LAYOUT.DEFAULT_COMPONENT_HEIGHT,
    children: [],
    expanded: true,
    type: COMPONENT_TYPES.COMPONENT,
    pattern: '',
    props: [],
    state: [],
    hooks: [],
    events: [],
    notes: ''
  };
}

// Drawing utilities
function setFont(fontConfig) {
  ctx.font = fontConfig;
}

function createGradient(file) {
  let gradient;
  
  if (file.isEventBox && file.type === 'HOOK') {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, COLORS.HOOK_START);
    gradient.addColorStop(1, COLORS.HOOK_END);
  } else if (file.isEventBox && file.type === 'TRIGGER') {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, COLORS.TRIGGER_START);
    gradient.addColorStop(1, COLORS.TRIGGER_END);
  } else {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, COLORS.COMPONENT_START);
    gradient.addColorStop(1, COLORS.COMPONENT_END);
  }
  
  return gradient;
}

function drawComponentBorder(file) {
  // Check if component is multi-selected
  if (multiSelectedFiles.includes(file)) {
    ctx.strokeStyle = COLORS.MULTI_SELECTED;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]); // Red dashed border for multi-selection
  } else if (selectedFile === file) {
    const isTopLevel = files.includes(file);
    
    if (isTopLevel) {
      ctx.strokeStyle = COLORS.SELECTED_BLUE;
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = COLORS.SELECTED_CHILD;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
    }
  } else if (hoveredFile === file && !draggingFile) {
    const isTopLevel = files.includes(file);
    
    if (!isTopLevel) {
      ctx.strokeStyle = COLORS.HOVER_BLUE;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
    } else {
      ctx.strokeStyle = COLORS.HOVER_TOP_LEVEL;
      ctx.lineWidth = 2;
    }
  } else {
    ctx.strokeStyle = COLORS.NORMAL_GRAY;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
  }
  
  ctx.beginPath();
  ctx.roundRect(file.x, file.y, file.w, file.h, LAYOUT.BORDER_RADIUS);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawShadow(file) {
  ctx.fillStyle = COLORS.SHADOW;
  ctx.beginPath();
  ctx.roundRect(
    file.x + LAYOUT.SHADOW_OFFSET, 
    file.y + LAYOUT.SHADOW_OFFSET, 
    file.w, 
    file.h, 
    LAYOUT.BORDER_RADIUS
  );
  ctx.fill();
}

// Text wrapping utility
function drawWrappedText(text, x, y, maxWidth, lineHeight = 16) {
  // First split by line breaks to handle explicit line breaks
  const lines = text.split('\n');
  let currentY = y;
  let totalLineCount = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineText = lines[lineIndex];
    
    // If the line is empty (from consecutive \n), just add vertical space
    if (lineText.trim() === '') {
      currentY += lineHeight;
      totalLineCount++;
      continue;
    }
    
    // Split each line by words for word wrapping within the line
    const words = lineText.split(' ');
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        totalLineCount++;
      } else {
        line = testLine;
      }
    }
    
    // Draw the last line of this text line
    if (line.trim()) {
      ctx.fillText(line, x, currentY);
    }
    
    // Add line spacing if not the last line
    if (lineIndex < lines.length - 1) {
      currentY += lineHeight;
    }
    totalLineCount++;
  }
  
  // Return both the final Y position and the number of lines
  return { finalY: currentY, lineCount: totalLineCount };
}

// Helper function to calculate wrapped text line count without drawing
function calculateWrappedTextLines(text, maxWidth, font = "12px 'Fira Code', 'Monaco', 'Menlo', monospace") {
  if (!text || !text.trim()) return 1;
  
  // Temporarily set font for measurement
  const originalFont = ctx.font;
  ctx.font = font;
  
  // First split by line breaks to handle explicit line breaks
  const lines = text.split('\n');
  let totalLineCount = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineText = lines[lineIndex];
    
    // If the line is empty (from consecutive \n), count it as one line
    if (lineText.trim() === '') {
      totalLineCount++;
      continue;
    }
    
    // Split each line by words for word wrapping within the line
    const words = lineText.split(' ');
    let line = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    lineCount++; // Count the last line
    
    totalLineCount += lineCount;
  }
  
  // Restore original font
  ctx.font = originalFont;
  
  return totalLineCount;
}

// JSX Rendering utilities
function drawJSXBracket(text, x, y, color = COLORS.KEYWORD_BLUE) {
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawJSXComponentName(name, x, y) {
  ctx.fillStyle = COLORS.TYPE_TEAL;
  ctx.fillText(name, x, y);
}

function drawJSXProp(propName, value, x, y) {
  // Prop name in parameter blue
  ctx.fillStyle = COLORS.PARAMETER_BLUE;
  ctx.fillText(`  ${propName}`, x, y);
  
  let currentX = x + ctx.measureText(`  ${propName}`).width;
  
  // Equals sign in keyword blue
  ctx.fillStyle = COLORS.KEYWORD_BLUE;
  ctx.fillText(`=`, currentX, y);
  currentX += ctx.measureText(`=`).width;
  
  // Value in string orange
  ctx.fillStyle = COLORS.STRING_ORANGE;
  ctx.fillText(`{${value}}`, currentX, y);
}

function drawJSXSelfClosingTag(componentName, x, y, padding, props = []) {
  setFont(FONTS.CODE);
  
  if (props.length > 0) {
    // Multi-line self-closing tag with props
    drawJSXBracket(`<`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING);
    drawJSXComponentName(
      componentName,
      x + padding + LAYOUT.JSX.BRACKET_OFFSET,
      y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING
    );
    
    let lineOffset = LAYOUT.LINE_HEIGHT.PROP + LAYOUT.JSX.PROP_SPACING;
    
    props.forEach(prop => {
      const value = prop.value || prop.name;
      drawJSXProp(prop.name, value, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING + lineOffset);
      lineOffset += LAYOUT.LINE_HEIGHT.PROP;
    });
    
    drawJSXBracket(`/>`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING + lineOffset);
  } else {
    // Simple self-closing tag
    drawJSXBracket(`<`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING);
    drawJSXComponentName(componentName, x + padding + LAYOUT.JSX.BRACKET_OFFSET, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING);
    drawJSXBracket(` />`, x + padding + LAYOUT.JSX.BRACKET_OFFSET + componentName.length * LAYOUT.JSX.CHAR_WIDTH, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET_SELF_CLOSING);
  }
}

function drawJSXOpeningTag(componentName, x, y, padding, props = []) {
  setFont(FONTS.CODE);
  
  if (props.length > 0) {
    // Multi-line opening tag with props
    drawJSXBracket(`<`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET);
    drawJSXComponentName(componentName, x + padding + LAYOUT.JSX.BRACKET_OFFSET, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET);
    
    let lineOffset = LAYOUT.LINE_HEIGHT.PROP + LAYOUT.JSX.PROP_SPACING;
    
    props.forEach(prop => {
      const value = prop.value || prop.name;
      drawJSXProp(prop.name, value, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET + lineOffset);
      lineOffset += LAYOUT.LINE_HEIGHT.PROP;
    });
    
    drawJSXBracket(`>`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET + lineOffset);
    return lineOffset + LAYOUT.LINE_HEIGHT.PROP;
  } else {
    // Simple opening tag
    drawJSXBracket(`<`, x + padding + LAYOUT.JSX.TAG_INDENT, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET);
    drawJSXComponentName(componentName, x + padding + LAYOUT.JSX.BRACKET_OFFSET, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET);
    drawJSXBracket(`>`, x + padding + LAYOUT.JSX.BRACKET_OFFSET + componentName.length * LAYOUT.JSX.CHAR_WIDTH, y + LAYOUT.JSX.TAG_VERTICAL_OFFSET);
    return LAYOUT.JSX.SIMPLE_TAG_RETURN;
  }
}

function drawJSXClosingTag(componentName, x, y, padding) {
  drawJSXBracket(`</`, x + padding + LAYOUT.JSX.TAG_INDENT, y);
  drawJSXComponentName(componentName, x + padding + LAYOUT.JSX.CLOSING_TAG_OFFSET, y);
  drawJSXBracket(`>`, x + padding + LAYOUT.JSX.CLOSING_TAG_OFFSET + componentName.length * LAYOUT.JSX.CHAR_WIDTH, y);
}

// ----------- Event Listeners -------------

canvas.addEventListener("dblclick", (e) => {
  const { x, y } = getMouse(e);
  
  // Don't create a new component if we double-clicked on a toggle
  if (isToggleAt(x, y, files)) {
    return;
  }
  
  // Don't create a new component if we double-clicked on an existing component
  const clickedFile = findFileAtPosition(x, y, files);
  if (clickedFile) {
    return;
  }
  
  // Only create a new component if we double-clicked on empty canvas space
  showInputAt(x, y);
});

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMouse(e);
  
  // Check for connection mode first
  if (isConnecting) {
    const clickedFile = findFileAtPosition(x, y, files);
    if (clickedFile) {
      if (!connectionStart) {
        // Start a new connection
        connectionStart = clickedFile;
        tempConnectionEnd = { x, y };
      } else if (clickedFile !== connectionStart) {
        // Check if connection already exists
        const existingConnection = connections.find(conn => 
          (conn.from === connectionStart && conn.to === clickedFile) ||
          (conn.from === clickedFile && conn.to === connectionStart)
        );
        
        if (!existingConnection) {
          // Complete the connection
          const newConnection = {
            id: Date.now(),
            from: connectionStart,
            to: clickedFile,
            fromPoint: getConnectionPoint(connectionStart, clickedFile),
            toPoint: getConnectionPoint(clickedFile, connectionStart)
          };
          connections.push(newConnection);
          saveState(); // Save state for undo
        }
        
        // Reset connection state
        resetConnectionMode();
      }
    } else {
      // Cancel connection if clicking on empty space
      resetConnectionMode();
    }
    draw();
    return;
  }
  
  // Check if clicking on a connection
  const clickedConnection = findConnectionAtPosition(x, y);
  if (clickedConnection) {
    selectedConnection = clickedConnection;
    clearSelection();
    draw();
    return;
  }
  
  const clickedFile = findFileAtPosition(x, y, files);
  
  if (clickedFile && !(e.ctrlKey || e.metaKey)) {
    // Handle single click on component (not Ctrl/Cmd)
    const isTopLevel = files.includes(clickedFile);
    const isSelected = isComponentSelected(clickedFile);
    
    // If clicking on a component that's part of multi-selection, keep multi-selection for dragging
    if (multiSelectedFiles.includes(clickedFile)) {
      // Keep multi-selection and allow dragging
      draggingFile = clickedFile;
      offsetX = x - draggingFile.x;
      offsetY = y - draggingFile.y;
      currentDropTarget = null;
      draw();
      return;
    }
    
    // Clear multi-selection and set single selection for new component
    clearSelection();
    selectedFile = clickedFile;
    selectedChild = isTopLevel ? null : clickedFile;
    
    if (isTopLevel || isSelected) {
      // This component can be dragged
      draggingFile = clickedFile;
      offsetX = x - draggingFile.x;
      offsetY = y - draggingFile.y;
      currentDropTarget = null;
      draw();
      return;
    }
    
    // Component is selected but not draggable (child component)
    draw();
    return;
  }
  
  if (clickedFile && (e.ctrlKey || e.metaKey)) {
    // Handle multi-selection with Ctrl/Cmd key
    if (multiSelectedFiles.includes(clickedFile)) {
      removeFromMultiSelection(clickedFile);
    } else {
      addToMultiSelection(clickedFile);
    }
    draw();
    return;
  }
  
  // Start area selection (for everything else - empty space, non-draggable components, etc.)
  if (!e.ctrlKey && !e.metaKey) {
    clearSelection();
  }
  
  isAreaSelecting = true;
  selectionAreaStart = { x, y };
  selectionAreaEnd = { x, y };
  selectedConnection = null;
});

canvas.addEventListener("mousemove", (e) => {
  const { x, y } = getMouse(e);
  
  // Update temporary connection endpoint if in connection mode
  if (isConnecting && connectionStart) {
    tempConnectionEnd = { x, y };
    draw();
    return;
  }
  
  // Handle area selection
  if (isAreaSelecting) {
    selectionAreaEnd = { x, y };
    draw();
    return;
  }
  
  if (!draggingFile) {
    // Track hover for cursor changes and visual feedback
    const newHoveredFile = findFileAtPosition(x, y, files);
    
    // Check for hovered connections
    const newHoveredConnection = findConnectionAtPosition(x, y);
    if (newHoveredConnection !== hoveredConnection) {
      hoveredConnection = newHoveredConnection;
      draw(); // Redraw to show hover effects
    }
    
    if (newHoveredFile !== hoveredFile) {
      hoveredFile = newHoveredFile;
      
      // Update cursor using utility function
      if (hoveredFile) {
        const isSelected = hoveredFile === selectedFile;
        updateCursorForComponent(hoveredFile, isSelected);
      } else {
        setCursor(isConnecting ? CURSORS.CROSSHAIR : (hoveredConnection ? CURSORS.POINTER : CURSORS.DEFAULT));
      }
      
      draw(); // Redraw to show hover effects
    }
    return;
  }
  
  // Calculate movement delta
  const deltaX = (x - offsetX) - draggingFile.x;
  const deltaY = (y - offsetY) - draggingFile.y;
  
  // Move the dragged file
  draggingFile.x = x - offsetX;
  draggingFile.y = y - offsetY;
  
  // If dragging a multi-selected component, move all multi-selected components
  if (multiSelectedFiles.includes(draggingFile)) {
    multiSelectedFiles.forEach(component => {
      if (component !== draggingFile) {
        component.x += deltaX;
        component.y += deltaY;
      }
    });
  }
  
  // Set cursor to grabbing while dragging
  setCursor(CURSORS.GRABBING);
  
  // Find the current drop target for visual feedback
  // Event boxes (Hook/Trigger) cannot be dropped into other components
  if (draggingFile.isEventBox || multiSelectedFiles.length > 0) {
    currentDropTarget = null;
  } else {
    currentDropTarget = findDropTarget(x, y, draggingFile, files);
  }
  
  draw();
});

canvas.addEventListener("mouseup", (e) => {
  const { x, y } = getMouse(e);

  // Handle area selection completion - this should always happen if we're area selecting
  if (isAreaSelecting) {
    const selectedComponents = selectComponentsInArea(
      files, 
      selectionAreaStart.x, 
      selectionAreaStart.y, 
      selectionAreaEnd.x, 
      selectionAreaEnd.y
    );

    if (selectedComponents.length > 0) {
      // Add to multi-selection (or replace if not holding Ctrl/Cmd)
      if (e.ctrlKey || e.metaKey) {
        selectedComponents.forEach(component => addToMultiSelection(component));
      } else {
        clearSelection();
        multiSelectedFiles = [...selectedComponents];
      }
    } else {
      // No components selected - clear selection if not holding Ctrl/Cmd
      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
    }
    
    isAreaSelecting = false;
    return;
  }
  
  if (!draggingFile) return;
  
  // Save state before making changes for undo functionality
  saveState();

  // Multi-selection drag handling - no drop targets allowed
  if (multiSelectedFiles.length > 0) {
    draggingFile = null;
    currentDropTarget = null;
    
    // Reset cursor based on what's under the mouse
    const hoveredComponent = findFileAtPosition(x, y, files);
    if (hoveredComponent) {
      const isTopLevel = files.includes(hoveredComponent);
      const isSelected = isComponentSelected(hoveredComponent);
      
      if (isTopLevel || isSelected) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'pointer';
      }
    } else {
      canvas.style.cursor = 'default';
    }
    
    draw();
    return;
  }

  // Single component drag handling
  // Event boxes (Hook/Trigger) cannot be dropped into other components
  let dropTarget = null;
  if (!draggingFile.isEventBox) {
    dropTarget = findDropTarget(x, y, draggingFile, files);
  }
  
  if (dropTarget) {
    // Find and remove dragged file from its current parent
    const currentParentInfo = findParentOfComponent(draggingFile, files);
    if (currentParentInfo.parent) {
      // Remove from current parent's children array
      removeFile(draggingFile, currentParentInfo.list);
      updateParentHeight(currentParentInfo.parent);
      repositionChildrenInParent(currentParentInfo.parent);
    } else {
      // Remove from top-level list
      removeFile(draggingFile, files);
    }

    // Add dragged as child of dropTarget
    dropTarget.children.push(draggingFile);

    // Position dragged file inside dropTarget visually
    // Update the positioning to account for props/hooks of the parent
    repositionChildrenInParent(dropTarget);
  } else {
    // No drop target found - check if we're dragging to empty canvas space
    const isTopLevel = files.includes(draggingFile);
    
    if (!isTopLevel) {
      // This is a child component being dragged to canvas - promote it to top level
      const currentParentInfo = findParentOfComponent(draggingFile, files);
      if (currentParentInfo.parent && currentParentInfo.list) {
        // Remove from current parent's children array
        removeFile(draggingFile, currentParentInfo.list);
        
        // Add to top-level files
        files.push(draggingFile);
        
        // Update the old parent's height since it lost a child
        updateParentHeight(currentParentInfo.parent);
        repositionChildrenInParent(currentParentInfo.parent);
        
        // Position the component at the drop location
        draggingFile.x = x - offsetX;
        draggingFile.y = y - offsetY;
      }
    }
  }

  draggingFile = null;
  currentDropTarget = null;
  
  // Reset cursor based on what's under the mouse
  const hoveredComponent = findFileAtPosition(x, y, files);
  if (hoveredComponent) {
    const isTopLevel = files.includes(hoveredComponent);
    const isSelected = hoveredComponent === selectedFile;
    
    if (isTopLevel) {
      canvas.style.cursor = 'grab';
    } else if (isSelected) {
      // Selected child components can be dragged
      canvas.style.cursor = 'grab';
    } else {
      // Non-selected child components show pointer for selection
      canvas.style.cursor = 'pointer';
    }
  } else {
    canvas.style.cursor = 'default';
  }
  
  draw();
});

canvas.addEventListener("click", (e) => {
  const { x, y } = getMouse(e);
  
  // Clear drop target when clicking (not dragging)
  currentDropTarget = null;
  
  // First check if we clicked a toggle
  if (toggleAt(x, y, files)) {
    saveState(); // Save state before toggle for undo
    draw();
    return;
  }
  
  // Check for Ctrl+click to duplicate (but not if we're doing multi-selection)
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
    const clickedFile = findFileAtPosition(x, y, files);
    if (clickedFile && multiSelectedFiles.length === 0) {
      saveState(); // Save state before duplication for undo
      duplicateComponent(clickedFile, x, y);
      return;
    }
  }
  
  // Handle config drawer opening - only for single selection
  if (multiSelectedFiles.length === 0 && selectedFile) {
    // Open the unified config drawer only for single selection
    openConfigDrawer(selectedFile);
  } else if (multiSelectedFiles.length === 0) {
    // No component selected, close config drawer
    closeConfigDrawer();
  }
  
  draw();
});

// ----------- Input Field for Component Names -------------

function showInputAt(x, y) {
  const input = document.createElement("input");
  input.type = "text";
  input.style.position = "absolute";
  
  // Simple coordinate conversion
  const rect = canvas.getBoundingClientRect();
  input.style.left = `${rect.left + x}px`;
  input.style.top = `${rect.top + y}px`;
  input.style.font = "16px monospace";
  input.style.padding = "2px";
  input.style.border = "1px solid #ccc";
  input.style.background = "white";
  input.style.zIndex = 1000;

  document.body.appendChild(input);
  input.focus();

  input.addEventListener("blur", () => finishInput(input, x, y));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      finishInput(input, x, y);
    }
  });
}

function finishInput(input, x, y) {
  const name = input.value.trim();
  try {
    document.body.removeChild(input); 
  } catch (e) {
    return; // If input was already removed, just return
  }
  if (!name) return;

  // Save state before adding new component for undo
  saveState();

  const file = createNewComponent(name, x, y);
  files.push(file);
  draw();
}

// ----------- Drawing -------------

function draw() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  files.forEach((file) => {
    // Check if this is an event box and if its parent component is collapsed
    if (file.isEventBox) {
      const parentComponent = getParentComponent(file);
      // Only draw the event box if the parent component is expanded or doesn't exist
      if (!parentComponent || parentComponent.expanded) {
        drawFile(file, 0);
      }
    } else {
      // Draw regular components normally
      drawFile(file, 0);
    }
  });
  
  // Draw connections between components
  drawConnections();
  
  // Draw temporary connection while in connection mode
  if (isConnecting && connectionStart) {
    drawTemporaryConnection();
  }
  
  // Draw selection area if area selecting
  drawSelectionArea();
  
  // Draw drop target indicators for all components
  drawDropTargetIndicators(files);
  
  // Draw drag indicator if dragging a component
  if (draggingFile) {
    // Only show drag indicator for child components, not top-level ones
    const isTopLevel = files.includes(draggingFile);
    if (!isTopLevel) {
      drawDragIndicator(draggingFile);
    }
  }
  
  // Save to localStorage after every draw
  saveToLocalStorage();
  
  // Also update URL state asynchronously on every canvas change (unless this is the initial load)
  if (!isInitialLoad) {
    saveToURLAsync();
  }
}

function drawFile(file, level = 0) {
  // Only skip drawing child components when they're being dragged
  // Top-level components should always be drawn normally during drag
  if (draggingFile === file) {
    const isTopLevel = files.includes(file);
    if (!isTopLevel) {
      // Skip drawing child components that are being dragged (they use drag indicator)
      return;
    }
    // Top-level components continue to be drawn normally
  }
  
  const padding = LAYOUT.PADDING_BASE + level * LAYOUT.PADDING_LEVEL_MULTIPLIER;
  
  // Calculate and set the proper width and height accounting for props and children
  let minWidth = Math.max(LAYOUT.MIN_COMPONENT_WIDTH, file.name.length * LAYOUT.COMPONENT.NAME_CHAR_WIDTH + LAYOUT.COMPONENT.NAME_BASE_WIDTH);
  
  // Calculate width needed for props display using ctx.measureText
  if (file.props && file.props.length > 0) {
    setFont(FONTS.CODE);
    file.props.forEach(prop => {
      const value = prop.value || prop.name;
      const propText = `  ${prop.name}={${value}}`;
      const propWidth = ctx.measureText(propText).width;
      minWidth = Math.max(minWidth, propWidth + LAYOUT.COMPONENT.PROP_WIDTH_PADDING);
    });
  }
  
  // Calculate width needed for child components recursively
  if (file.children && file.children.length > 0 && file.expanded) {
    const childrenMaxWidth = calculateMaxChildWidth(file, padding + LAYOUT.CHILD_PADDING);
    // Parent should only be 10px wider than its widest child
    minWidth = Math.max(minWidth, childrenMaxWidth + LAYOUT.COMPONENT.CHILD_WIDTH_MARGIN);
  }
  
  file.w = minWidth;
  
  if (file.expanded) {
    updateParentHeight(file);
  } else {
    updateParentHeight(file); // This will calculate the correct height including props
  }

  // Special rendering for event boxes
  if (file.isEventBox) {
    // Calculate proper height based on description text wrapping BEFORE drawing
    const baseHeight = 60; // Base height for title and padding
    const availableWidth = file.w - (LAYOUT.COMPONENT.EVENT_TITLE_X_OFFSET * 2);
    
    if (file.description && file.description.trim()) {
      const descriptionLineCount = calculateWrappedTextLines(file.description, availableWidth);
      const descriptionHeight = descriptionLineCount * 14; // 14px line height for 12px font
      file.h = baseHeight + descriptionHeight - 14; // Subtract 14 since base height includes one line
    } else {
      file.h = baseHeight;
    }
  }

  // Create gradient using utility function
  const gradient = createGradient(file);

  // Draw shadow using utility function
  drawShadow(file);
  
  // Draw main component box with gradient
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(file.x, file.y, file.w, file.h, LAYOUT.BORDER_RADIUS);
  ctx.fill();
  
  // Draw border using utility function
  drawComponentBorder(file);

  // Reset line dash after drawing
  ctx.setLineDash([]);

  // Toggle symbol (only show if component has children or content AND is top-level)
  const hasContent = (file.children && file.children.length > 0) || 
                    (file.hooks && file.hooks.length > 0) ||
                    (file.innerHtml && file.innerHtml.trim());
  const isTopLevel = files.includes(file);
  
  if (hasContent && isTopLevel) {
    ctx.fillStyle = COLORS.LIGHT_TEXT;
    setFont(FONTS.TOGGLE);
    const toggleSymbol = file.expanded ? "▾" : "▸";
    ctx.fillText(toggleSymbol, file.x + LAYOUT.TOGGLE_AREA.x, file.y + LAYOUT.COMPONENT.TOGGLE_Y_OFFSET);
  }

  // Component type indicator (top right)
  setFont(FONTS.TYPE_INDICATOR);
  
  // Measure text width to ensure proper right alignment
  const typeText = file.type.toUpperCase();
  const textWidth = ctx.measureText(typeText).width;
  const textX = file.x + file.w - textWidth - 10;
  const textY = file.y + LAYOUT.JSX.SIMPLE_TAG_RETURN;
  
  if (file.isEventBox) {
    ctx.fillStyle = "#000000"; // Black text for event boxes
  } else {
    ctx.fillStyle = COLORS.COMMENT_GREEN; // Green text for regular components
  }
  ctx.fillText(typeText, textX, textY);

  // Continue with event box text rendering
  if (file.isEventBox) {
    // Draw event box title (event name) in bold
    const textColor = "#2d2d30";
    ctx.fillStyle = textColor;
    ctx.font = FONTS.EVENT_TITLE;
    ctx.fillText(file.name || 'Event', file.x + LAYOUT.COMPONENT.EVENT_TITLE_X_OFFSET, file.y + LAYOUT.COMPONENT.EVENT_TITLE_Y_OFFSET);
    
    // Draw event description with text wrapping
    if (file.description && file.description.trim()) {
      ctx.fillStyle = "#666666";
      ctx.font = FONTS.EVENT_DESCRIPTION;
      
      const availableWidth = file.w - (LAYOUT.COMPONENT.EVENT_TITLE_X_OFFSET * 2);
      
      // Draw wrapped text starting from the description Y offset
      drawWrappedText(
        file.description, 
        file.x + LAYOUT.COMPONENT.EVENT_TITLE_X_OFFSET, 
        file.y + LAYOUT.COMPONENT.EVENT_DESC_Y_OFFSET, 
        availableWidth, 
        14 // Line height for 12px font
      );
    }
    
    return; // Skip the rest of the component rendering for event boxes
  }

  // Check if component has children
  const hasChildren = file.children && file.children.length > 0;
  const hasInnerHtml = file.innerHtml && file.innerHtml.trim();
  // A component should be self-closing if it has no children, no hooks, and no inner HTML
   if (!hasChildren && (!file.hooks || file.hooks.length === 0) && !hasInnerHtml) {
    // Draw as self-closing tag using utility function
    drawJSXSelfClosingTag(file.name, file.x, file.y, padding, file.props || []);
  } else {
    // Draw as opening tag using utility function
    const offsetFromProps = drawJSXOpeningTag(file.name, file.x, file.y, padding, file.props || []);

    if (file.expanded) {
      let offsetY = file.y + 30 + offsetFromProps + 10; // Base tag position + tag height + small gap

      // Draw inner HTML content if it exists
      if (file.innerHtml && file.innerHtml.trim()) {
        ctx.fillStyle = COLORS.INNER_HTML_GRAY; // Gray color for inner content
        setFont(FONTS.CODE_SMALL);
        
        // Split inner HTML by lines and render each line
        const innerHtmlLines = file.innerHtml.split('\n');
        innerHtmlLines.forEach(line => {
          if (line.trim()) {
            ctx.fillText(`  ${line}`, file.x + padding + LAYOUT.JSX.CONTENT_INDENT, offsetY);
            offsetY += LAYOUT.LINE_HEIGHT.INNER_HTML;
          } else {
            offsetY += LAYOUT.LINE_HEIGHT.INNER_HTML_EMPTY; // Small gap for empty lines
          }
        });
        offsetY += 10; // Extra space after inner HTML
      }

      // Draw hooks if any
      if (file.hooks && file.hooks.length > 0) {
        ctx.fillStyle = COLORS.COMMENT_GREEN;
        setFont(FONTS.COMMENT);
        ctx.fillText("// Hooks:", file.x + padding + LAYOUT.JSX.CONTENT_INDENT, offsetY);
        offsetY += 16;
        file.hooks.forEach(hook => {
          ctx.fillStyle = COLORS.FUNCTION_YELLOW;
          setFont(FONTS.CODE_TINY);
          ctx.fillText(`• ${hook}`, file.x + padding + LAYOUT.JSX.HOOK_INDENT, offsetY);
          offsetY += LAYOUT.LINE_HEIGHT.HOOK;
        });
        offsetY += 10;
      }

      // Draw child components as JSX elements inside the parent
      if (file.children && file.children.length > 0) {
        offsetY = drawChildrenAsJSX(file, padding + 30, offsetY, file.x);
      }

      // JSX closing tag using utility function
      drawJSXClosingTag(file.name, file.x, offsetY, padding);
    }
  }
}

// ----------- Export/Import -------------

function exportProject() {
  const projectData = {
    name: "React Component Plan",
    created: new Date().toISOString(),
    components: files
  };
  
  const dataStr = JSON.stringify(projectData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'react-component-plan.json';
  link.click();
}

function importProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        if (projectData.components) {
          files = projectData.components;
          draw();
        }
      } catch (err) {
        alert('Error importing file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  
  input.click();
}

// ----------- Local Storage Functions -------------

function saveToLocalStorage() {
  try {
    const projectData = {
      files: files,
      connections: connections,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('react-component-planner', JSON.stringify(projectData));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('react-component-planner');
    if (savedData) {
      const projectData = JSON.parse(savedData);
      if (projectData.files) {
        files = projectData.files;
      }
      if (projectData.connections) {
        // Reconstruct connections with proper component references
        connections = reconstructConnections(projectData.connections, files);
      }
      console.log('Loaded project from localStorage');
      return true;
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return false;
}

// Helper function to reconstruct connections after loading from localStorage
function reconstructConnections(savedConnections, loadedFiles) {
  const reconstructedConnections = [];
  
  // Create a flat list of all components (including nested children) for lookup
  function flattenComponents(componentList) {
    let flatList = [];
    componentList.forEach(component => {
      flatList.push(component);
      if (component.children && component.children.length > 0) {
        flatList = flatList.concat(flattenComponents(component.children));
      }
    });
    return flatList;
  }
  
  const allComponents = flattenComponents(loadedFiles);
  
  // Function to find a component by its properties
  function findComponentByProperties(savedComponent) {
    return allComponents.find(component => 
      component.name === savedComponent.name &&
      component.x === savedComponent.x &&
      component.y === savedComponent.y &&
      component.type === savedComponent.type
    );
  }
  
  // Reconstruct each connection
  savedConnections.forEach(savedConnection => {
    const fromComponent = findComponentByProperties(savedConnection.from);
    const toComponent = findComponentByProperties(savedConnection.to);
    
    if (fromComponent && toComponent) {
      reconstructedConnections.push({
        id: savedConnection.id,
        from: fromComponent,
        to: toComponent,
        fromPoint: getConnectionPoint(fromComponent, toComponent),
        toPoint: getConnectionPoint(toComponent, fromComponent)
      });
    } else {
      console.warn('Could not reconstruct connection:', savedConnection);
    }
  });
  
  return reconstructedConnections;
}

// ----------- Keyboard Shortcuts -------------

document.addEventListener('keydown', (e) => {
  // Check if the event originated from within the config drawer
  const drawer = document.getElementById('configDrawer');
  if (drawer && drawer.contains(e.target)) {
    // Allow normal input behavior in the drawer, don't propagate to canvas
    return;
  }
  
  // Check if the user is typing in an input field (like the component name input)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    // Allow normal input behavior, don't interfere with typing
    return;
  }
  
  // Ctrl/Cmd + S to export
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportProject();
  }
  
  // Ctrl/Cmd + O to import
  if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
    e.preventDefault();
    importProject();
  }
  
  // Ctrl/Cmd + Z to undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }
  
  // C key to toggle connection mode
  if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    toggleConnectionMode();
  }
  
  // Delete key or Backspace to delete selected component or connection
  if ((e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault(); // Prevent browser back navigation on backspace
    
    if (selectedConnection) {
      // Delete selected connection
      saveState(); // Save state before deletion for undo
      connections = connections.filter(conn => conn !== selectedConnection);
      selectedConnection = null;
      draw();
    } else if (multiSelectedFiles.length > 0) {
      // Delete all multi-selected components
      saveState(); // Save state before deletion for undo
      
      // Create a copy of the array to avoid issues with modifying while iterating
      const componentsToDelete = [...multiSelectedFiles];
      
      componentsToDelete.forEach(component => {
        // Find the parent of this component
        const parentInfo = findParentOfComponent(component, files);
        
        if (parentInfo.parent) {
          // This is a child component, remove from parent's children
          const childIndex = parentInfo.parent.children.indexOf(component);
          if (childIndex !== -1) {
            parentInfo.parent.children.splice(childIndex, 1);
            // Update parent height after removing child
            updateParentHeight(parentInfo.parent);
            repositionChildrenInParent(parentInfo.parent);
          }
        } else {
          // This is a top-level component, remove from files array
          const fileIndex = files.indexOf(component);
          if (fileIndex !== -1) {
            files.splice(fileIndex, 1);
          }
        }
        
        // Remove any connections that reference this component
        connections = connections.filter(connection => 
          connection.from !== component && connection.to !== component
        );
      });
      
      clearSelection();
      hoveredFile = null; // Clear hover state
      closeConfigDrawer(); // Close drawer when components are deleted
      draw();
    } else if (selectedFile) {
      // Delete selected component
      saveState(); // Save state before deletion for undo
      removeFile(selectedFile, files);
      clearSelection();
      hoveredFile = null; // Clear hover state
      closeConfigDrawer(); // Close drawer when component is deleted
      draw();
    }
  }
  
  // Escape to deselect or cancel connection mode
  if (e.key === 'Escape') {
    const drawer = document.getElementById('configDrawer');
    if (drawer && drawer.classList.contains('open')) {
      closeConfigDrawer();
    }
    
    // Cancel connection mode
    if (isConnecting) {
      resetConnectionMode();
    }
    
    selectedFile = null;
    selectedChild = null;
    selectedConnection = null;
    multiSelectedFiles = [];
    draw();
  }
});

// ----------- URL State Management -------------

// Throttling variables for async URL updates
let urlUpdateTimeout = null;
const URL_UPDATE_DELAY = 300; // milliseconds

function saveToURL() {
  try {
    const projectData = {
      files: files,
      connections: connections,
      timestamp: new Date().toISOString()
    };
    
    // Compress the data by converting to JSON and then base64
    const jsonString = JSON.stringify(projectData);
    const encodedData = btoa(encodeURIComponent(jsonString));
    
    // Update URL without triggering a page reload
    const url = new URL(window.location);
    url.searchParams.set('state', encodedData);
    window.history.replaceState({}, '', url);
    
  } catch (error) {
    console.warn('Failed to save to URL:', error);
  }
}

// Async wrapper for URL updates with throttling
function saveToURLAsync() {
  // Clear any pending URL update
  if (urlUpdateTimeout) {
    clearTimeout(urlUpdateTimeout);
  }
  
  // Schedule URL update for the next tick, with throttling
  urlUpdateTimeout = setTimeout(() => {
    saveToURL();
    urlUpdateTimeout = null;
  }, URL_UPDATE_DELAY);
}

function loadFromURL() {
  try {
    const url = new URL(window.location);
    const encodedState = url.searchParams.get('state');
    
    if (encodedState) {
      // Decode the base64 data back to JSON
      const jsonString = decodeURIComponent(atob(encodedState));
      const projectData = JSON.parse(jsonString);
      
      if (projectData.files) {
        files = projectData.files;
      }
      if (projectData.connections) {
        // Reconstruct connections with proper component references
        connections = reconstructConnections(projectData.connections, files);
      }
      
      console.log('Loaded project from URL state');
      return true;
    }
  } catch (error) {
    console.warn('Failed to load from URL:', error);
  }
  return false;
}

function shareProject() {
  saveToURL();
  
  // Copy URL to clipboard
  navigator.clipboard.writeText(window.location.href).then(() => {
    // Show a temporary notification
    showNotification('Project URL copied to clipboard! Share this link to let others view your canvas.');
  }).catch(err => {
    // Fallback: show the URL in a dialog
    const url = window.location.href;
    prompt('Copy this URL to share your project:', url);
  });
}

function showNotification(message) {
  // Create a temporary notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ----------- Component Duplication -------------

function duplicateComponent(originalFile, x, y) {
  // Deep clone the component and all its children
  function deepCloneComponent(component) {
    return {
      name: component.name, // Keep the exact same name
      x: component.x + 30, // Offset slightly
      y: component.y + 30,
      w: component.w,
      h: component.h,
      children: component.children.map(child => deepCloneComponent(child)),
      expanded: component.expanded,
      type: component.type,
      pattern: component.pattern,
      props: [...(component.props || [])],
      state: [...(component.state || [])],
      hooks: [...(component.hooks || [])],
      events: [...(component.events || [])],
      notes: component.notes || '',
      notes: component.notes || ''
    };
  }

  const duplicatedFile = deepCloneComponent(originalFile);
  
  // Position the duplicate near the click location
  duplicatedFile.x = x + 20;
  duplicatedFile.y = y + 20;
  
  // Add to the same parent as the original
  const parentList = findParentOfComponent(originalFile, files);
  if (parentList) {
    parentList.push(duplicatedFile);
  } else {
    files.push(duplicatedFile);
  }
  
  // Select the new duplicate
  selectedFile = duplicatedFile;
  draw();
}

function findParentList(targetFile, searchList) {
  // Check if target is in this list
  if (searchList.includes(targetFile)) {
    return searchList;
  }
  
  // Search in children
  for (const file of searchList) {
    const found = findParentList(targetFile, file.children);
    if (found) return found;
  }
  
  return null;
}

// ----------- Component Positioning -------------

function repositionChildrenInParent(parentComponent) {
  // Since children are now drawn as JSX elements inside the parent,
  // we just need to update the parent's height
  updateParentHeight(parentComponent);
  
  // Recursively update any nested children that have their own children
  if (parentComponent.children) {
    parentComponent.children.forEach(child => {
      if (child.children && child.children.length > 0) {
        repositionChildrenInParent(child);
      }
    });
  }
}

// Helper function to calculate the maximum width needed for child components recursively
function calculateMaxChildWidth(component, baseIndent) {
  let maxWidth = 0;
  
  if (!component.children || component.children.length === 0) {
    return maxWidth;
  }
  
  ctx.font = "bold 14px 'Fira Code', 'Monaco', 'Menlo', monospace";
  
  component.children.forEach(child => {
    let childRequiredWidth = baseIndent; // Start with the indentation
    
    // Calculate width for the child's opening tag
    const childHasChildren = child.children && child.children.length > 0;
    const childHasInnerHtml = child.innerHtml && child.innerHtml.trim();
    const hasChildProps = (child.props && child.props.length > 0);
    
    if (childHasChildren || childHasInnerHtml) {
      // Opening tag
      childRequiredWidth += ctx.measureText(`<${child.name}`).width;
      
      if (hasChildProps) {
        // Multi-line props
        let maxPropWidth = 0;
        
        if (child.props && child.props.length > 0) {
          child.props.forEach(prop => {
            const value = prop.value || prop.name;
            const propText = `  ${prop.name}={${value}}`;
            const propWidth = ctx.measureText(propText).width;
            maxPropWidth = Math.max(maxPropWidth, propWidth);
          });
        }
        
        childRequiredWidth = Math.max(childRequiredWidth, baseIndent + maxPropWidth);
      } else {
        // Simple opening tag
        childRequiredWidth += ctx.measureText(`>`).width;
      }
      
      // Closing tag
      const closingTagWidth = baseIndent + ctx.measureText(`</${child.name}>`).width;
      childRequiredWidth = Math.max(childRequiredWidth, closingTagWidth);
      
      // Recursively check nested children
      const nestedMaxWidth = calculateMaxChildWidth(child, baseIndent + 20);
      childRequiredWidth = Math.max(childRequiredWidth, nestedMaxWidth);
      
    } else {
      // Self-closing tag
      if (hasChildProps) {
        // Multi-line self-closing tag
        childRequiredWidth += ctx.measureText(`<${child.name}`).width;
        
        let maxPropWidth = 0;
        
        if (child.props && child.props.length > 0) {
          child.props.forEach(prop => {
            const value = prop.value || prop.name;
            const propText = `  ${prop.name}={${value}}`;
            const propWidth = ctx.measureText(propText).width;
            maxPropWidth = Math.max(maxPropWidth, propWidth);
          });
        }
        
        childRequiredWidth = Math.max(childRequiredWidth, baseIndent + maxPropWidth);
        
        // Self-closing tag ending
        const selfClosingEndWidth = baseIndent + ctx.measureText(`/>`).width;
        childRequiredWidth = Math.max(childRequiredWidth, selfClosingEndWidth);
      } else {
        // Simple self-closing tag
        childRequiredWidth += ctx.measureText(`<${child.name} />`).width;
      }
    }
    
    // Return the actual required width without extra padding
    // The parent will add its own 10px margin
    maxWidth = Math.max(maxWidth, childRequiredWidth);
  });
  
  return maxWidth;
}

function calculateComponentHeight(component) {
  let height = 50; // Header height
  
  // Check if component has any content
  const hasChildren = component.children && component.children.length > 0;
  const hasHooks = component.hooks && component.hooks.length > 0;
  const hasProps = component.props && component.props.length > 0;
  const hasContent = hasChildren || hasHooks;
  
  // Add height for multi-line props in the opening tag
  if (hasProps) {
    const propsCount = hasProps ? component.props.length : 0;
    height += propsCount * 20 + 20; // 20px per prop + 20px for closing
  }
  
  // If no expandable content, return calculated height
  if (!hasContent) {
    return height;
  }
  
  if (component.expanded) {
    // Add space for hooks
    if (hasHooks) {
      height += (component.hooks.length * 16) + 26;
    }
    
    // Add space for child JSX elements (just text lines, not component boxes)
    if (hasChildren) {
      height += calculateChildJSXHeight(component);
    }
    
    height += 40; // Space for closing tag and padding
  }
  
  return height;
}

// Helper function to calculate height needed for child JSX text
function calculateChildJSXHeight(component) {
  let height = 0;
  
  if (component.children && component.children.length > 0) {
    component.children.forEach(child => {
      const childHasChildren = child.children && child.children.length > 0;
      const childHasInnerHtml = child.innerHtml && child.innerHtml.trim();
      const hasChildProps = (child.props && child.props.length > 0);
      
      if (childHasChildren || childHasInnerHtml) {
        // Child components are always expanded
        if (hasChildProps) {
          height += 20; // Opening tag name
          height += (child.props ? child.props.length : 0) * 20; // Props lines
          height += 25; // Closing part of opening tag
        } else {
          height += 25; // Simple opening tag
        }
        
        // Add height for inner HTML content
        if (childHasInnerHtml) {
          const innerHtmlLines = child.innerHtml.split('\n');
          const contentLines = innerHtmlLines.filter(line => line.trim()).length;
          const emptyLines = innerHtmlLines.length - contentLines;
          height += (contentLines * 16) + (emptyLines * 12); // 16px per content line, 12px per empty line
        }
        
        // Add height for nested children
        if (childHasChildren) {
          height += calculateChildJSXHeight(child); // Nested children
        }
        
        height += 25; // Closing tag
      } else {
        // Self-closing tag
        if (hasChildProps) {
          height += 20; // Opening tag name
          height += (child.props ? child.props.length : 0) * 20; // Props lines
          height += 25; // Closing part of self-closing tag
        } else {
          height += 25; // Simple self-closing tag
        }
      }
    });
  }
  
  return height;
}

function updateParentHeight(parentComponent) {
  // Check if component has any content
  const hasChildren = parentComponent.children && parentComponent.children.length > 0;
  const hasHooks = parentComponent.hooks && parentComponent.hooks.length > 0;
  const hasProps = parentComponent.props && parentComponent.props.length > 0;
  const hasInnerHtml = parentComponent.innerHtml && parentComponent.innerHtml.trim();
  const hasContent = hasChildren || hasHooks || hasInnerHtml;
  
  let totalHeight = LAYOUT.COMPONENT.HEADER_HEIGHT; // Header with new larger size
  
  // Add height for multi-line props in the opening tag
  if (hasProps) {
    const propsCount = hasProps ? parentComponent.props.length : 0;
    totalHeight += propsCount * 20 + 20; // 20px per prop + 20px for closing
  }
  
  if (!parentComponent.expanded || !hasContent) {
    parentComponent.h = totalHeight;
    return;
  }
  
  // Add space for inner HTML content
  if (hasInnerHtml) {
    const innerHtmlLines = parentComponent.innerHtml.split('\n');
    const contentLines = innerHtmlLines.filter(line => line.trim()).length;
    const emptyLines = innerHtmlLines.length - contentLines;
    totalHeight += (contentLines * 16) + (emptyLines * 12) + 10; // 16px per content line, 12px per empty line, 10px padding
  }
  
  // Add space for hooks  
  if (hasHooks) {
    totalHeight += (parentComponent.hooks.length * 16) + 26;
  }
  
  // Add space for child JSX elements (just text, not component boxes)
  if (hasChildren) {
    totalHeight += calculateChildJSXHeight(parentComponent);
  }
  
  totalHeight += LAYOUT.COMPONENT.CLOSING_TAG_SPACING; // Closing tag space and padding
  parentComponent.h = totalHeight;
}

// ----------- Undo Functionality -------------

function saveState() {
  // Deep clone the current state
  const state = {
    files: JSON.parse(JSON.stringify(files)),
    connections: JSON.parse(JSON.stringify(connections)),
    selectedFile: selectedFile,
    selectedChild: selectedChild,
    multiSelectedFiles: [...multiSelectedFiles]
  };
  
  history.push(state);
  
  // Keep history within size limit
  if (history.length > maxHistorySize) {
    history.shift();
  }
}

function undo() {
  if (history.length === 0) return;
  
  const previousState = history.pop();
  files = previousState.files;
  
  // Reconstruct connections with proper component references (like we do for localStorage)
  if (previousState.connections) {
    connections = reconstructConnections(previousState.connections, files);
  } else {
    connections = []; // Handle backward compatibility
  }
  
  selectedFile = previousState.selectedFile;
  selectedChild = previousState.selectedChild;
  multiSelectedFiles = previousState.multiSelectedFiles || [];
  
  draw();
}

// ----------- Recursive Utilities -------------

function findFileAtPosition(x, y, list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const file = list[i];
    
    // Skip event boxes that are hidden due to collapsed parent
    if (file.isEventBox) {
      const parentComponent = getParentComponent(file);
      if (parentComponent && !parentComponent.expanded) {
        continue; // Skip this file
      }
    }
    
    // Check children first (to prioritize nested components)
    if (file.children && file.children.length > 0) {
      const nested = findFileAtPosition(x, y, file.children);
      if (nested) return nested;
    }
    
    // Then check the current file
    if (
      file.x !== undefined &&
      file.y !== undefined &&
      file.w !== undefined &&
      file.h !== undefined &&
      x >= file.x &&
      x <= file.x + file.w &&
      y >= file.y &&
      y <= file.y + file.h
    ) {
      return file;
    }
  }
  return null;
}

function findDropTarget(x, y, draggedFile, list) {
  // Event boxes (Hook/Trigger) cannot be drop targets
  // Also, event boxes cannot be dropped into anything
  if (draggedFile.isEventBox) {
    return null;
  }
  
  // First check nested components (deeper components take priority)
  for (const file of list) {
    if (file !== draggedFile && file.children && file.children.length > 0 && !file.isEventBox) {
      const nested = findDropTarget(x, y, draggedFile, file.children);
      if (nested) return nested;
    }
  }
  
  // Then check current level components
  for (const file of list) {
    if (
      file !== draggedFile &&
      !file.isEventBox && // Event boxes cannot be drop targets
      file.x !== undefined &&
      file.y !== undefined &&
      file.w !== undefined &&
      file.h !== undefined &&
      x >= file.x &&
      x <= file.x + file.w &&
      y >= file.y &&
      y <= file.y + file.h &&
      !isDescendantOf(file, draggedFile) // Prevent dropping parent into child
    ) {
      return file;
    }
  }
  
  return null;
}

// Helper function to check if a component is a descendant of another
function isDescendantOf(potentialChild, potentialParent) {
  if (!potentialParent.children) return false;
  
  for (const child of potentialParent.children) {
    if (child === potentialChild) return true;
    if (isDescendantOf(potentialChild, child)) return true;
  }
  
  return false;
}

function removeFile(target, list) {
  const index = list.indexOf(target);
  if (index !== -1) {
    list.splice(index, 1);
    
    // Remove any connections that reference this component
    connections = connections.filter(connection => 
      connection.from !== target && connection.to !== target
    );
    
    // Clear selected connection if it was referencing the deleted component
    if (selectedConnection && 
        (selectedConnection.from === target || selectedConnection.to === target)) {
      selectedConnection = null;
    }
    
    return true;
  }
  for (const file of list) {
    if (removeFile(target, file.children)) return true;
  }
  return false;
}

function isToggleAt(x, y, list) {
  for (const file of list) {
    // Only check toggle for top-level components
    const isTopLevel = files.includes(file);
    
    if (isTopLevel) {
      const toggleArea = {
        x: file.x + LAYOUT.TOGGLE_AREA.x,
        y: file.y + LAYOUT.TOGGLE_AREA.y,
        w: LAYOUT.TOGGLE_AREA.w,
        h: LAYOUT.TOGGLE_AREA.h,
      };

      if (
        x >= toggleArea.x &&
        x <= toggleArea.x + toggleArea.w &&
        y >= toggleArea.y &&
        y <= toggleArea.y + toggleArea.h
      ) {
        return true;
      }
    }

    // Don't recursively check children since they can't be toggled
  }
  return false;
}

function toggleAt(x, y, list) {
  for (const file of list) {
    // Only allow toggle for top-level components
    const isTopLevel = files.includes(file);
    
    if (isTopLevel) {
      const toggleArea = {
        x: file.x + LAYOUT.TOGGLE_AREA.x,
        y: file.y + LAYOUT.TOGGLE_AREA.y,
        w: LAYOUT.TOGGLE_AREA.w,
        h: LAYOUT.TOGGLE_AREA.h,
      };

      if (
        x >= toggleArea.x &&
        x <= toggleArea.x + toggleArea.w &&
        y >= toggleArea.y &&
        y <= toggleArea.y + toggleArea.h
      ) {
        file.expanded = !file.expanded;
        
        // Reposition children when expanding
        if (file.expanded && file.children.length > 0) {
          repositionChildrenInParent(file);
        }
        
        // Update all parent heights in the hierarchy
        updateAllParentHeights(files);
        
        return true;
      }
    }

    // Don't recursively check children since they can't be toggled
  }
  return false;
}

function updateAllParentHeights(list) {
  list.forEach(file => {
    if (file.expanded) {
      updateParentHeight(file);
      if (file.children.length > 0) {
        updateAllParentHeights(file.children);
      }
    }
  });
}

function getMouse(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

// Function to draw drop target indicators for all components, including nested ones
function drawDropTargetIndicators(componentList, level = 0) {
  componentList.forEach(component => {
    // Draw drop indicator if this component is the current drop target
    if (currentDropTarget === component && draggingFile && component.x !== undefined) {
      // Draw green dashed border
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.beginPath();
      ctx.roundRect(component.x, component.y, component.w, component.h, 8);
      ctx.stroke();
      
      // Draw drop text indicator
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 11px sans-serif";
      ctx.shadowBlur = 0;
      ctx.fillText("📥 Drop here", component.x + component.w - 70, component.y + 15);
      
      // Reset styles
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }
    
    // Recursively check all children for drop targets (they're positioned for hit detection)
    if (component.children) {
      drawDropTargetIndicators(component.children, level + 1);
    }
  });
}

// Function to draw drag indicator when dragging a component
function drawDragIndicator(draggedComponent) {
  if (!draggedComponent) return;
  
  // Save current context state
  const originalAlpha = ctx.globalAlpha;
  
  // Set semi-transparent for the drag indicator
  ctx.globalAlpha = 0.6;
  
  // Calculate drag indicator size
  const indicatorWidth = Math.max(LAYOUT.DRAG.MIN_WIDTH, draggedComponent.name.length * LAYOUT.DRAG.NAME_WIDTH_MULTIPLIER + LAYOUT.DRAG.BASE_WIDTH_PADDING);
  const indicatorHeight = LAYOUT.DRAG.HEIGHT;
  
  // Position at current drag location
  const indicatorX = draggedComponent.x;
  const indicatorY = draggedComponent.y;
  
  // Draw shadow for the drag indicator
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(indicatorX + LAYOUT.DRAG.SHADOW_OFFSET, indicatorY + LAYOUT.DRAG.SHADOW_OFFSET, indicatorWidth, indicatorHeight, LAYOUT.BORDER_RADIUS);
  ctx.fill();
  
  // Create gradient for the drag indicator (VS Code theme)
  let gradient = ctx.createLinearGradient(indicatorX, indicatorY, indicatorX + indicatorWidth, indicatorY + indicatorHeight);
  
  // Use consistent VS Code dark theme colors for all component types
  gradient.addColorStop(0, "#2d3142"); // Dark blue-gray
  gradient.addColorStop(1, "#1e1e2e"); // Darker blue-gray
  
  // Draw the main drag indicator box
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, LAYOUT.BORDER_RADIUS);
  ctx.fill();
  
  // Draw border for drag indicator
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, LAYOUT.BORDER_RADIUS);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw component name in the drag indicator with VS Code colors
  ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
  ctx.fillText(`<`, indicatorX + LAYOUT.COMPONENT.EVENT_TITLE_X_OFFSET, indicatorY + LAYOUT.DRAG.TEXT_Y_OFFSET);
  ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
  ctx.fillText(`${draggedComponent.name}`, indicatorX + LAYOUT.DRAG.COMPONENT_NAME_X_OFFSET, indicatorY + LAYOUT.DRAG.TEXT_Y_OFFSET);
  ctx.fillStyle = "#569cd6"; // VS Code keyword blue
  ctx.fillText(` />`, indicatorX + LAYOUT.DRAG.COMPONENT_NAME_X_OFFSET + draggedComponent.name.length * LAYOUT.DRAG.NAME_WIDTH_MULTIPLIER, indicatorY + LAYOUT.DRAG.TEXT_Y_OFFSET);
  
  // Add a small drag icon
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "12px sans-serif";
  ctx.fillText("⌖", indicatorX + indicatorWidth - LAYOUT.DRAG.ICON_X_OFFSET, indicatorY + LAYOUT.DRAG.ICON_Y_OFFSET);
  
  // Restore original alpha
  ctx.globalAlpha = originalAlpha;
}

// Helper function to draw highlight box for child components
function drawHighlightBox(x, y, width, height, colorType) {
  const isSelection = colorType === COLORS.SELECTION;
  const isHover = colorType === COLORS.HOVER;
  
  if (isSelection) {
    ctx.strokeStyle = COLORS.SELECTED_CHILD;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
  } else if (isHover) {
    ctx.strokeStyle = COLORS.HOVER_BLUE;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
  }
  
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, LAYOUT.BORDER_RADIUS);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Helper function to draw children as JSX text recursively
function drawChildrenAsJSX(parentComponent, indentLevel, startY, baseX) {
  let offsetY = startY;
  
  if (parentComponent.children && parentComponent.children.length > 0) {
    parentComponent.children.forEach((child) => {
      // Skip drawing this child if it's currently being dragged
      if (draggingFile === child) {
        return;
      }
      
      // Store the starting Y position to calculate actual height later
      const childStartY = offsetY;
      
      // Calculate hit detection area accounting for multi-line props and inner HTML
      const hasChildProps = (child.props && child.props.length > 0);
      const childHasInnerHtml = child.innerHtml && child.innerHtml.trim();
      
      // Calculate width using ctx.measureText for consistency with calculateMaxChildWidth
      ctx.font = "bold 14px 'Fira Code', 'Monaco', 'Menlo', monospace";
      let childRequiredWidth = indentLevel; // Start with the indentation
      
      const childHasChildren = child.children && child.children.length > 0;
      
      if (childHasChildren || childHasInnerHtml) {
        // Opening tag
        childRequiredWidth += ctx.measureText(`<${child.name}`).width;
        
        if (hasChildProps) {
          // Multi-line props
          let maxPropWidth = 0;
          
          if (child.props && child.props.length > 0) {
            child.props.forEach(prop => {
              const value = prop.value || prop.name;
              const propText = `  ${prop.name}={${value}}`;
              const propWidth = ctx.measureText(propText).width;
              maxPropWidth = Math.max(maxPropWidth, propWidth);
            });
          }
          
          childRequiredWidth = Math.max(childRequiredWidth, indentLevel + maxPropWidth);
        } else {
          // Simple opening tag
          childRequiredWidth += ctx.measureText(`>`).width;
        }
        
        // Closing tag
        const closingTagWidth = indentLevel + ctx.measureText(`</${child.name}>`).width;
        childRequiredWidth = Math.max(childRequiredWidth, closingTagWidth);
        
        // Check nested children if any
        if (child.children && child.children.length > 0) {
          const nestedMaxWidth = calculateMaxChildWidth(child, indentLevel + 20);
          childRequiredWidth = Math.max(childRequiredWidth, nestedMaxWidth);
        }
        
      } else {
        // Self-closing tag
        if (hasChildProps) {
          // Multi-line self-closing tag
          childRequiredWidth += ctx.measureText(`<${child.name}`).width;
          
          let maxPropWidth = 0;
          
          if (child.props && child.props.length > 0) {
            child.props.forEach(prop => {
              const value = prop.value || prop.name;
              const propText = `  ${prop.name}={${value}}`;
              const propWidth = ctx.measureText(propText).width;
              maxPropWidth = Math.max(maxPropWidth, propWidth);
            });
          }
          
          childRequiredWidth = Math.max(childRequiredWidth, indentLevel + maxPropWidth);
          
          // Self-closing tag ending
          const selfClosingEndWidth = indentLevel + ctx.measureText(`/>`).width;
          childRequiredWidth = Math.max(childRequiredWidth, selfClosingEndWidth);
        } else {
          // Simple self-closing tag
          childRequiredWidth += ctx.measureText(`<${child.name} />`).width;
        }
      }
      
      // Set position for hit detection
      child.x = baseX + indentLevel;
      child.y = offsetY - 18;
      child.w = childRequiredWidth + 100; // Add consistent padding like other width calculations
      // Height will be calculated after rendering based on actual offsetY change
      
      ctx.fillStyle = "white";
      ctx.font = "bold 14px 'Fira Code', 'Monaco', 'Menlo', monospace";
      
      if (childHasChildren || childHasInnerHtml) {
        // Always draw child components as expanded (no collapse option for children)
        const hasChildProps = (child.props && child.props.length > 0);
        
        if (hasChildProps) {
          // Draw opening tag first
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for <
          ctx.fillText(`<`, child.x, offsetY);
          ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
          ctx.fillText(`${child.name}`, child.x + 9, offsetY);
          offsetY += 20;
          
          // Draw props on separate lines
          if (child.props && child.props.length > 0) {
            child.props.forEach(prop => {
              const value = prop.value || prop.name;
              ctx.fillStyle = "#9cdcfe"; // VS Code parameter blue
              ctx.fillText(`  ${prop.name}`, child.x, offsetY);
              let currentX = child.x + ctx.measureText(`  ${prop.name}`).width;
              ctx.fillStyle = "#569cd6"; // VS Code keyword blue for =
              ctx.fillText(`=`, currentX, offsetY);
              currentX += ctx.measureText(`=`).width;
              ctx.fillStyle = "#ce9178"; // VS Code string orange
              ctx.fillText(`{${value}}`, currentX, offsetY);
              offsetY += 20;
            });
          }
          
          // Draw closing part of opening tag
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue
          ctx.fillText(`>`, child.x, offsetY);
          offsetY += 25;
        } else {
          // Simple opening tag without props
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for <
          ctx.fillText(`<`, child.x, offsetY);
          ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
          ctx.fillText(`${child.name}`, child.x + 9, offsetY);
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for >
          ctx.fillText(`>`, child.x + 9 + child.name.length * 10, offsetY);
          offsetY += 25;
        }
        
        // Draw inner HTML content if it exists
        if (childHasInnerHtml) {
          const innerHtmlLines = child.innerHtml.split('\n');
          innerHtmlLines.forEach(line => {
            if (line.trim()) {
              // Content line
              ctx.fillStyle = COLORS.INNER_HTML_GRAY; // Gray color for content
              ctx.font = "14px 'Fira Code', 'Monaco', 'Menlo', monospace";
              ctx.fillText(`  ${line.trim()}`, child.x, offsetY);
              offsetY += 25;
            } else {
              // Empty line
              offsetY += 12;
            }
          });
        }
        
        // Recursively draw nested children
        if (childHasChildren) {
          offsetY = drawChildrenAsJSX(child, indentLevel + 20, offsetY, baseX);
        }
        
        // Draw closing tag
        ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
        ctx.fillText(`</`, child.x, offsetY);
        ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
        ctx.fillText(`${child.name}`, child.x + 18, offsetY);
        ctx.fillStyle = "#569cd6"; // VS Code keyword blue
        ctx.fillText(`>`, child.x + 18 + child.name.length * 10, offsetY);
        offsetY += 25;
      } else {
        // Draw self-closing for nested child
        const hasChildProps = (child.props && child.props.length > 0);
        
        if (hasChildProps) {
          // Draw opening tag first
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for <
          ctx.fillText(`<`, child.x, offsetY);
          ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
          ctx.fillText(`${child.name}`, child.x + 9, offsetY);
          offsetY += 20;
          
          // Draw props on separate lines
          if (child.props && child.props.length > 0) {
            child.props.forEach(prop => {
              const value = prop.value || prop.name;
              ctx.fillStyle = "#9cdcfe"; // VS Code parameter blue
              ctx.fillText(`  ${prop.name}`, child.x, offsetY);
              let currentX = child.x + ctx.measureText(`  ${prop.name}`).width;
              ctx.fillStyle = "#569cd6"; // VS Code keyword blue for =
              ctx.fillText(`=`, currentX, offsetY);
              currentX += ctx.measureText(`=`).width;
              ctx.fillStyle = "#ce9178"; // VS Code string orange
              ctx.fillText(`{${value}}`, currentX, offsetY);
              offsetY += 20;
            });
          }
          
          // Draw closing part of self-closing tag
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue
          ctx.fillText(`/>`, child.x, offsetY);
          offsetY += 25;
        } else {
          // Simple self-closing tag without props
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
          ctx.fillText(`<`, child.x, offsetY);
          ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
          ctx.fillText(`${child.name}`, child.x + 9, offsetY);
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue
          ctx.fillText(`/>`, child.x + 9 + child.name.length * 10, offsetY);
          offsetY += 25;
        }
      }
      
      // Calculate actual height based on how much offsetY moved
      child.h = offsetY - childStartY;
      
      // Apply selection/hover highlighting now that we know the actual dimensions
      if (selectedFile === child) {
        drawHighlightBox(child.x - 2, child.y - 2, child.w + 4, child.h + 4, COLORS.SELECTION);
      } else if (hoveredFile === child) {
        drawHighlightBox(child.x - 2, child.y - 2, child.w + 4, child.h + 4, COLORS.HOVER);
      }
    });
  }
  
  return offsetY;
}

canvas.addEventListener("mouseleave", (e) => {
  // Reset cursor and hover state when mouse leaves canvas
  canvas.style.cursor = 'default';
  hoveredFile = null;
  draw();
});

draw();

function findParentOfComponent(targetFile, searchList, parent = null) {
  // Check if target is in this list
  for (const file of searchList) {
    if (file === targetFile) {
      return { parent: parent, list: searchList };
    }
    
    // Search in children
    if (file.children && file.children.length > 0) {
      const found = findParentOfComponent(targetFile, file.children, file);
      if (found.parent !== undefined) return found;
    }
  }
  
  return { parent: undefined, list: null };
}

// ----------- Toolbar Functions -------------

// ----------- Toolbar Functions -------------

function clearCanvas() {
  if (confirm('Are you sure you want to clear all components? This cannot be undone.')) {
    saveState(); // Save state before clearing for undo
    files = [];
    connections = []; // Clear all connections
    clearSelection();
    hoveredFile = null;
    draw();
  }
}

function selectToolbar(idBtn) {
  const toolbarButtons = document.querySelectorAll(".toolbar-btn");

  const selectionToogle = (activebtn) =>  {
    toolbarButtons.forEach(btn => {
      if (btn.id === activebtn) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

    switch (idBtn) {
      case 'connectBtn':
          toggleConnectionMode();
          selectionToogle(idBtn);
          break;
      case 'grabBtn':
          selectionToogle(idBtn);
          break;
      case 'clearBtn':
          clearCanvas();
          break;
      case 'notesBtn':
            break;
      case 'pointerBtn':
      default:
        selectionToogle(idBtn);
        break;
    }

}


// ----------- Connection System Functions -------------

function toggleConnectionMode() {
  isConnecting = !isConnecting;
  const connectionBtn = document.getElementById("connectBtn")
  
  if (isConnecting) {
    connectionStart = null;
    canvas.style.cursor = 'crosshair';
    selectedFile = null;
    selectedChild = null;
    selectedConnection = null;
  } else {
    resetConnectionMode();
  }
  draw();
}

function getConnectionPoint(fromComponent, toComponent) {
  // Calculate the connection point on the edge of the component closest to the target
  const fromCenter = {
    x: fromComponent.x + fromComponent.w / 2,
    y: fromComponent.y + fromComponent.h / 2
  };
  const toCenter = {
    x: toComponent.x + toComponent.w / 2,
    y: toComponent.y + toComponent.h / 2
  };
  
  // Calculate angle from fromComponent to toComponent
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const angle = Math.atan2(dy, dx);
  
  // Calculate connection point on the edge of fromComponent
  const halfWidth = fromComponent.w / 2;
  const halfHeight = fromComponent.h / 2;
  
  // Determine which edge the connection point should be on
  const absAngle = Math.abs(angle);
  const edgeAngle = Math.atan2(halfHeight, halfWidth);
  
  let connectionPoint;
  if (absAngle <= edgeAngle) {
    // Right edge
    connectionPoint = {
      x: fromComponent.x + fromComponent.w,
      y: fromCenter.y + Math.tan(angle) * halfWidth
    };
  } else if (absAngle >= Math.PI - edgeAngle) {
    // Left edge
    connectionPoint = {
      x: fromComponent.x,
      y: fromCenter.y - Math.tan(angle) * halfWidth
    };
  } else if (angle > 0) {
    // Bottom edge
    connectionPoint = {
      x: fromCenter.x + halfHeight / Math.tan(angle),
      y: fromComponent.y + fromComponent.h
    };
  } else {
    // Top edge
    connectionPoint = {
      x: fromCenter.x - halfHeight / Math.tan(angle),
      y: fromComponent.y
    };
  }
  
  return connectionPoint;
}

function drawConnections() {
  connections.forEach(connection => {
    // Skip drawing connections to event boxes that are hidden due to collapsed parent
    if (connection.to.isEventBox) {
      const parentComponent = getParentComponent(connection.to);
      if (parentComponent && !parentComponent.expanded) {
        return; // Skip this connection
      }
    }
    
    // Update connection points in case components moved
    connection.fromPoint = getConnectionPoint(connection.from, connection.to);
    connection.toPoint = getConnectionPoint(connection.to, connection.from);
    
    drawArrow(
      connection.fromPoint.x,
      connection.fromPoint.y,
      connection.toPoint.x,
      connection.toPoint.y,
      connection === selectedConnection,
      connection === hoveredConnection
    );
  });
}

function drawTemporaryConnection() {
  if (!connectionStart) return;
  
  const startPoint = getConnectionPoint(connectionStart, { 
    x: tempConnectionEnd.x - 50, 
    y: tempConnectionEnd.y - 25, 
    w: 100, 
    h: 50 
  });
  
  // Draw temporary arrow in a different style
  ctx.save();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line
  
  drawArrow(
    startPoint.x,
    startPoint.y,
    tempConnectionEnd.x,
    tempConnectionEnd.y,
    false,
    false,
    true // isTemporary flag
  );
  
  ctx.restore();
}

function drawArrow(fromX, fromY, toX, toY, isSelected = false, isHovered = false, isTemporary = false) {
  ctx.save();
  
  // Set style based on state
  if (isSelected) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
  } else if (isHovered) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
  } else if (isTemporary) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
  } else {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
  }
  
  // Calculate orthogonal path points
  const pathPoints = calculateOrthogonalPath(fromX, fromY, toX, toY);
  
  // Draw the orthogonal path
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  
  ctx.stroke();
  
  // Draw arrowhead at the final point
  const lastPoint = pathPoints[pathPoints.length - 1];
  const secondLastPoint = pathPoints[pathPoints.length - 2];
  
  const headLength = 12;
  const headAngle = Math.PI / 6;
  const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
  
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(
    lastPoint.x - headLength * Math.cos(angle - headAngle),
    lastPoint.y - headLength * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    lastPoint.x - headLength * Math.cos(angle + headAngle),
    lastPoint.y - headLength * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function calculateOrthogonalPath(fromX, fromY, toX, toY) {
  const minDistance = 30; // Minimum distance for orthogonal segments
  const path = [];
  
  // Start point
  path.push({ x: fromX, y: fromY });
  
  // Calculate the distance between points
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  // Check if we need routing at all (direct connection is clean)
  if (absX < 5 && absY < 5) {
    // Very close points, direct connection
    path.push({ x: toX, y: toY });
    return path;
  }
  
  // Determine if we can do a simple L-shape or need a more complex route
  if (absX > minDistance && absY > minDistance) {
    // Both distances are significant - use simple L-shape routing
    if (absX > absY) {
      // Horizontal first, then vertical
      path.push({ x: fromX + deltaX / 2, y: fromY });
      path.push({ x: fromX + deltaX / 2, y: toY });
    } else {
      // Vertical first, then horizontal  
      path.push({ x: fromX, y: fromY + deltaY / 2 });
      path.push({ x: toX, y: fromY + deltaY / 2 });
    }
  } else if (absX > absY) {
    // Primarily horizontal movement
    if (absX > minDistance * 2) {
      // Enough space for clean horizontal routing
      const midX = fromX + deltaX / 2;
      path.push({ x: midX, y: fromY });
      path.push({ x: midX, y: toY });
    } else {
      // Need to route around - use vertical detour
      const detourY = fromY + (deltaY > 0 ? minDistance : -minDistance);
      path.push({ x: fromX, y: detourY });
      path.push({ x: toX, y: detourY });
    }
  } else {
    // Primarily vertical movement
    if (absY > minDistance * 2) {
      // Enough space for clean vertical routing
      const midY = fromY + deltaY / 2;
      path.push({ x: fromX, y: midY });
      path.push({ x: toX, y: midY });
    } else {
      // Need to route around - use horizontal detour
      const detourX = fromX + (deltaX > 0 ? minDistance : -minDistance);
      path.push({ x: detourX, y: fromY });
      path.push({ x: detourX, y: toY });
    }
  }
  
  // End point
  path.push({ x: toX, y: toY });
  
  return path;
}

function findConnectionAtPosition(x, y) {
  const tolerance = 8; // Tolerance for clicking on connection lines
  
  for (const connection of connections) {
    // Calculate the orthogonal path for this connection
    const pathPoints = calculateOrthogonalPath(
      connection.fromPoint.x, connection.fromPoint.y,
      connection.toPoint.x, connection.toPoint.y
    );
    
    // Check if the point is near any segment of the orthogonal path
    for (let i = 0; i < pathPoints.length - 1; i++) {
      if (isPointNearLine(
        x, y,
        pathPoints[i].x, pathPoints[i].y,
        pathPoints[i + 1].x, pathPoints[i + 1].y,
        tolerance
      )) {
        return connection;
      }
    }
  }
  
  return null;
}

function isPointNearLine(px, py, x1, y1, x2, y2, tolerance) {
  // Calculate distance from point to line segment
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line is actually a point
    return Math.sqrt(A * A + B * B) <= tolerance;
  }
  
  let param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

// ----------- Configuration Drawer Functions -------------

// ----------- Unified Configuration Drawer Functions -------------

function openConfigDrawer(item) {
  const drawer = document.getElementById('configDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const componentContent = document.getElementById('componentConfigContent');
  const eventContent = document.getElementById('eventConfigContent');
  
  drawer.classList.add('open');
  
  if (item.isEventBox) {
    // Show event configuration content
    drawerTitle.textContent = 'Hook Configuration';
    componentContent.style.display = 'none';
    eventContent.style.display = 'block';
    
    // Populate event box name
    document.getElementById('eventBoxName').value = item.name || '';
    
    // Populate event box description
    document.getElementById('eventBoxDescription').value = item.description || '';
  } else {
    // Show component configuration content
    drawerTitle.textContent = 'Component Configuration';
    eventContent.style.display = 'none';
    componentContent.style.display = 'block';
    
    // Populate component name
    document.getElementById('componentName').value = item.name;
    
    // Populate inner HTML
    document.getElementById('innerHtml').value = item.innerHtml || '';
    
    // Populate props
    const propsList = document.getElementById('propsList');
    propsList.innerHTML = '';
    if (item.props && item.props.length > 0) {
      item.props.forEach((prop, index) => {
        addPropToDOM(prop.name, prop.value || '', index);
      });
    }
    
    // Populate events
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    if (item.events && item.events.length > 0) {
      item.events.forEach((event, index) => {
        addEventToDOM(event.name, event.description || '', index);
      });
    }
    
    // Clear hook inputs list when opening drawer
    const hookInputsList = document.getElementById('hookInputsList');
    hookInputsList.innerHTML = '';
    
    // Clear trigger inputs list when opening drawer
    const triggerInputsList = document.getElementById('triggerInputsList');
    triggerInputsList.innerHTML = '';
    
    // Display connected hooks and triggers
    displayConnectedHooks(item);
    displayConnectedTriggers(item);
  }
}

function closeConfigDrawer() {
  const drawer = document.getElementById('configDrawer');
  drawer.classList.remove('open');
}

function updateEventBoxName() {
  if (!selectedFile || !selectedFile.isEventBox) return;
  
  const newName = document.getElementById('eventBoxName').value.trim();
  if (newName !== selectedFile.name) {
    saveState(); // Save state before change for undo
    selectedFile.name = newName;
    draw();
  }
}

function updateEventBoxDescription() {
  if (!selectedFile || !selectedFile.isEventBox) return;
  
  const newDescription = document.getElementById('eventBoxDescription').value;
  if (newDescription !== selectedFile.description) {
    saveState(); // Save state before change for undo
    selectedFile.description = newDescription;
    draw();
  }
}

function updateComponentName() {
  if (!selectedFile) return;
  
  const newName = document.getElementById('componentName').value.trim();
  if (newName && newName !== selectedFile.name) {
    saveState(); // Save state before change for undo
    selectedFile.name = newName;
    draw();
  }
}

function updateInnerHtml() {
  if (!selectedFile) return;
  
  const newInnerHtml = document.getElementById('innerHtml').value;
  if (newInnerHtml !== (selectedFile.innerHtml || '')) {
    saveState(); // Save state before change for undo
    selectedFile.innerHtml = newInnerHtml;
    draw();
  }
}

// ----------- Prop and Event Functions -------------

function addProp() {
  if (!selectedFile) return;
  
  const index = selectedFile.props ? selectedFile.props.length : 0;
  addPropToDOM('', '', index);
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function addPropToDOM(name, value, index) {
  const propsList = document.getElementById('propsList');
  
  const propItem = document.createElement('div');
  propItem.className = 'prop-item';
  propItem.innerHTML = `
    <input type="text" class="form-input" placeholder="Prop name" value="${name}" 
           onchange="updateProp(${index}, 'name', this.value)">
    <input type="text" class="form-input prop-value" placeholder="Value (optional)" value="${value}" 
           onchange="updateProp(${index}, 'value', this.value)">
    <button class="remove-btn" onclick="removeProp(${index})">×</button>
  `;
  
  propsList.appendChild(propItem);
  
  // Initialize prop in component if it doesn't exist
  if (selectedFile) {
    if (!selectedFile.props) selectedFile.props = [];
    if (!selectedFile.props[index]) {
      selectedFile.props[index] = { name: name, value: value };
    }
  }
}

function updateProp(index, field, value) {
  if (!selectedFile || !selectedFile.props || !selectedFile.props[index]) return;
  
  saveState(); // Save state before change for undo
  selectedFile.props[index][field] = value;
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function removeProp(index) {
  if (!selectedFile || !selectedFile.props) return;
  
  saveState(); // Save state before change for undo
  selectedFile.props.splice(index, 1);
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  // Refresh the props list
  openConfigDrawer(selectedFile);
  draw();
}

// ----------- Hook Input Functions -------------

function addHookInput() {
  if (!selectedFile) return;
  
  const index = 0; // Always create a new hook input at index 0
  addHookInputToDOM('', '', index);
}

function addHookInputToDOM(name, description, index) {
  const hookInputsList = document.getElementById('hookInputsList');
  
  const hookItem = document.createElement('div');
  hookItem.className = 'hook-input-container'; // Use a different class to avoid prop-item styling
  hookItem.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    border: 1px solid #444;
    border-radius: 4px;
    margin-bottom: 10px;
  `;
  hookItem.innerHTML = `
    <div style="display: flex; flex-direction: column;">
      <input type="text" class="form-input" placeholder="Hook name" value="${name}" 
             id="hookName_${index}" style="width: 100%; margin-bottom: 0;">
    </div>
    <div style="display: flex; flex-direction: column;">
      <input type="text" class="form-input" placeholder="Description" value="${description}" 
             id="hookDescription_${index}" style="width: 100%; margin-bottom: 0;">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="secondary-btn" onclick="removeHookInput(${index})">Cancel</button>
      <button class="add-btn" onclick="createHookFromInput(${index})">Save</button>
    </div>
  `;
  
  hookInputsList.appendChild(hookItem);
}

function removeHookInput(index) {
  const hookInputsList = document.getElementById('hookInputsList');
  const hookItems = hookInputsList.getElementsByClassName('hook-input-container');
  if (hookItems[index]) {
    hookItems[index].remove();
  }
}

function createHookFromInput(index) {
  if (!selectedFile) return;
  
  // Get values from the specific input fields
  const nameInput = document.getElementById(`hookName_${index}`);
  const descriptionInput = document.getElementById(`hookDescription_${index}`);
  
  if (!nameInput || !descriptionInput) return;
  
  const hookName = nameInput.value.trim() || 'useHook';
  const hookDescription = descriptionInput.value.trim() || 'Hook event description';
  
  saveState(); // Save state before adding for undo
  
  // Create a new Hook box positioned near the current component
  const offsetX = 250; // Position to the right of the component
  const offsetY = 0;   // Same vertical level
  
  const hookBox = {
    name: hookName,
    description: hookDescription,
    x: selectedFile.x + selectedFile.w + offsetX,
    y: selectedFile.y + offsetY,
    w: 200,
    h: 60,
    type: 'HOOK',
    isEventBox: true,
    parentComponent: null
  };
  
  // Add the Hook box to the files array
  files.push(hookBox);
  
  // Create a connection from the current component to the Hook box
  const newConnection = {
    id: Date.now(),
    from: selectedFile,
    to: hookBox,
    fromPoint: getConnectionPoint(selectedFile, hookBox),
    toPoint: getConnectionPoint(hookBox, selectedFile)
  };
  connections.push(newConnection);
  
  // Remove the input after creating the hook box
  removeHookInput(index);
  
  // Refresh the connected displays
  displayConnectedHooks(selectedFile);
  displayConnectedTriggers(selectedFile);
  
  // Update the canvas
  draw();
}

// ----------- Trigger Input Functions -------------

function addTriggerInput() {
  if (!selectedFile) return;
  
  const index = 0; // Always create a new trigger input at index 0
  addTriggerInputToDOM('', '', index);
}

function addTriggerInputToDOM(name, actions, index) {
  const triggerInputsList = document.getElementById('triggerInputsList');
  
  const triggerItem = document.createElement('div');
  triggerItem.className = 'trigger-input-container'; // Use a different class to avoid prop-item styling
  triggerItem.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    border: 1px solid #444;
    border-radius: 4px;
    margin-bottom: 10px;
  `;
  triggerItem.innerHTML = `
    <div style="display: flex; flex-direction: column;">
      <input type="text" class="form-input" placeholder="Trigger Name (eg. onClick)" value="${name}" 
             id="triggerName_${index}" style="width: 100%; margin-bottom: 0;">
    </div>
    <div style="display: flex; flex-direction: column;">
      <textarea type="textarea" rows="3" class="form-input" placeholder="eg.\n1. Call API\n2. Toast Notification " value="${actions}" 
             id="triggerActions_${index}" style="width: 100%; margin-bottom: 0;"></textarea>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="secondary-btn" onclick="removeTriggerInput(${index})">Cancel</button>
      <button class="add-btn" onclick="createTriggerFromInput(${index})">Save</button>
    </div>
  `;
  
  triggerInputsList.appendChild(triggerItem);
}

function removeTriggerInput(index) {
  const triggerInputsList = document.getElementById('triggerInputsList');
  const triggerItems = triggerInputsList.getElementsByClassName('trigger-input-container');
  if (triggerItems[index]) {
    triggerItems[index].remove();
  }
}

function createTriggerFromInput(index) {
  if (!selectedFile) return;
  
  // Get values from the specific input fields
  const nameInput = document.getElementById(`triggerName_${index}`);
  const actionsInput = document.getElementById(`triggerActions_${index}`);
  
  if (!nameInput || !actionsInput) return;
  
  const triggerName = nameInput.value.trim() || 'NewTrigger';
  const triggerDescription = actionsInput.value.trim() || '1. Handler';
  
  saveState(); // Save state before adding for undo
  
  // Create a new Trigger box positioned near the current component
  const offsetX = 250; // Position to the right of the component
  const offsetY = 60;   // Slightly below hooks
  
  const triggerBox = {
    name: triggerName,
    description: triggerDescription,
    x: selectedFile.x + selectedFile.w + offsetX,
    y: selectedFile.y + offsetY,
    w: 200,
    h: 60,
    type: 'TRIGGER',
    isEventBox: true,
    parentComponent: null
  };
  
  // Add the Trigger box to the files array
  files.push(triggerBox);
  
  // Create a connection from the current component to the Trigger box
  const newConnection = {
    id: Date.now(),
    from: selectedFile,
    to: triggerBox,
    fromPoint: getConnectionPoint(selectedFile, triggerBox),
    toPoint: getConnectionPoint(triggerBox, selectedFile)
  };
  connections.push(newConnection);
  
  // Remove the input after creating the trigger box
  removeTriggerInput(index);
  
  // Refresh the connected displays
  displayConnectedHooks(selectedFile);
  displayConnectedTriggers(selectedFile);
  
  // Update the canvas
  draw();
}

// Helper function to find connected hooks and triggers for a component
function getConnectedEventBoxes(component, type) {
  const connectedBoxes = [];
  
  connections.forEach(connection => {
    // Check if this component is the source of a connection to an event box
    if (connection.from === component && 
        connection.to.isEventBox && 
        connection.to.type === type) {
      connectedBoxes.push({
        eventBox: connection.to,
        connection: connection
      });
    }
  });
  
  return connectedBoxes;
}

// Helper function to find the parent component of an event box
function getParentComponent(eventBox) {
  if (!eventBox.isEventBox) return null;
  
  // Find a connection where this event box is the "to" component
  const connection = connections.find(conn => conn.to === eventBox);
  
  // Return the "from" component, which is the parent
  return connection ? connection.from : null;
}

// Function to display connected hooks
function displayConnectedHooks(component) {
  const connectedHooks = getConnectedEventBoxes(component, 'HOOK');
  const hooksContainer = document.getElementById('connectedHooksList');
  
  if (!hooksContainer) return;
  
  hooksContainer.innerHTML = '';
  
  if (connectedHooks.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.cssText = `
      color: #888;
      font-style: italic;
      font-size: 12px;
      padding: 8px 0;
    `;
    emptyMessage.textContent = 'No hooks connected';
    hooksContainer.appendChild(emptyMessage);
    return;
  }
  
  connectedHooks.forEach((item, index) => {
    const hookItem = document.createElement('div');
    hookItem.className = 'connected-item';
    hookItem.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: rgba(255, 214, 10, 0.1);
      border: 1px solid rgba(255, 214, 10, 0.3);
      border-radius: 6px;
      font-size: 14px;
    `;
    
    hookItem.innerHTML = `
      <span class="connected-name" style="color: #b8860b; font-weight: 600;">${item.eventBox.name}</span>
      <button class="remove-btn" onclick="removeConnectedHook('${item.connection.id}')" title="Remove hook connection" style="
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 4px;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;
    hooksContainer.appendChild(hookItem);
  });
}

// Function to display connected triggers
function displayConnectedTriggers(component) {
  const connectedTriggers = getConnectedEventBoxes(component, 'TRIGGER');
  const triggersContainer = document.getElementById('connectedTriggersList');
  
  if (!triggersContainer) return;
  
  triggersContainer.innerHTML = '';
  
  if (connectedTriggers.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.cssText = `
      color: #888;
      font-style: italic;
      font-size: 12px;
      padding: 8px 0;
    `;
    emptyMessage.textContent = 'No triggers connected';
    triggersContainer.appendChild(emptyMessage);
    return;
  }
  
  connectedTriggers.forEach((item, index) => {
    const triggerItem = document.createElement('div');
    triggerItem.className = 'connected-item';
    triggerItem.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: rgba(255, 107, 157, 0.1);
      border: 1px solid rgba(255, 107, 157, 0.3);
      border-radius: 6px;
      font-size: 14px;
    `;
    
    triggerItem.innerHTML = `
      <span class="connected-name" style="color: #d63384; font-weight: 600;">${item.eventBox.name}</span>
      <button class="remove-btn" onclick="removeConnectedTrigger('${item.connection.id}')" title="Remove trigger connection" style="
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 4px;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;
    triggersContainer.appendChild(triggerItem);
  });
}

// Function to remove a connected hook
function removeConnectedHook(connectionId) {
  saveState(); // Save state before removing for undo
  
  // Find and remove the connection
  const connectionIndex = connections.findIndex(conn => conn.id.toString() === connectionId);
  if (connectionIndex !== -1) {
    const connection = connections[connectionIndex];
    
    // Remove the hook box from the files array
    const hookBoxIndex = files.findIndex(file => file === connection.to);
    if (hookBoxIndex !== -1) {
      files.splice(hookBoxIndex, 1);
    }
    
    // Remove the connection
    connections.splice(connectionIndex, 1);
    
    // Refresh the display
    if (selectedFile) {
      displayConnectedHooks(selectedFile);
      displayConnectedTriggers(selectedFile);
    }
    
    draw();
  }
}

// Function to remove a connected trigger
function removeConnectedTrigger(connectionId) {
  saveState(); // Save state before removing for undo
  
  // Find and remove the connection
  const connectionIndex = connections.findIndex(conn => conn.id.toString() === connectionId);
  if (connectionIndex !== -1) {
    const connection = connections[connectionIndex];
    
    // Remove the trigger box from the files array
    const triggerBoxIndex = files.findIndex(file => file === connection.to);
    if (triggerBoxIndex !== -1) {
      files.splice(triggerBoxIndex, 1);
    }
    
    // Remove the connection
    connections.splice(connectionIndex, 1);
    
    // Refresh the display
    if (selectedFile) {
      displayConnectedHooks(selectedFile);
      displayConnectedTriggers(selectedFile);
    }
    
    draw();
  }
}

// Cleanup pending URL updates on page unload
window.addEventListener('beforeunload', () => {
  if (urlUpdateTimeout) {
    clearTimeout(urlUpdateTimeout);
    // Force immediate URL save before page unload
    saveToURL();
  }
});
