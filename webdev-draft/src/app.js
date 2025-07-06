const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

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
        connectionStart = null;
        isConnecting = false;
        canvas.style.cursor = 'default';
        
        // Reset connection button state
        const connectionBtn = document.getElementById('connectionModeBtn');
        connectionBtn.classList.remove('active');
        connectionBtn.style.background = '';
        connectionBtn.style.color = '';
      }
    } else {
      // Cancel connection if clicking on empty space
      connectionStart = null;
      isConnecting = false;
      canvas.style.cursor = 'default';
      
      // Reset connection button state
      const connectionBtn = document.getElementById('connectionModeBtn');
      connectionBtn.classList.remove('active');
      connectionBtn.style.background = '';
      connectionBtn.style.color = '';
    }
    draw();
    return;
  }
  
  // Check if clicking on a connection
  const clickedConnection = findConnectionAtPosition(x, y);
  if (clickedConnection) {
    selectedConnection = clickedConnection;
    selectedFile = null;
    selectedChild = null;
    draw();
    return;
  }
  
  const clickedFile = findFileAtPosition(x, y, files);
  
  if (clickedFile) {
    // Check if this is a top-level component or a child
    const isTopLevel = files.includes(clickedFile);
    
    // Allow dragging if:
    // 1. It's a top-level component (always draggable), OR
    // 2. It's a child component AND it's selected
    if (isTopLevel || clickedFile === selectedFile) {
      draggingFile = clickedFile;
      offsetX = x - draggingFile.x;
      offsetY = y - draggingFile.y;
      currentDropTarget = null; // Clear any previous drop target
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const { x, y } = getMouse(e);
  
  // Update temporary connection endpoint if in connection mode
  if (isConnecting && connectionStart) {
    tempConnectionEnd = { x, y };
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
      
      // Set cursor based on component type and selection state
      if (hoveredFile) {
        const isTopLevel = files.includes(hoveredFile);
        const isSelected = hoveredFile === selectedFile;
        
        if (isConnecting) {
          canvas.style.cursor = 'crosshair';
        } else if (isTopLevel) {
          canvas.style.cursor = 'grab';
        } else if (isSelected) {
          // Selected child components can be dragged
          canvas.style.cursor = 'grab';
        } else {
          // Non-selected child components show pointer for selection
          canvas.style.cursor = 'pointer';
        }
      } else {
        canvas.style.cursor = isConnecting ? 'crosshair' : (hoveredConnection ? 'pointer' : 'default');
      }
      
      draw(); // Redraw to show hover effects
    }
    return;
  }
  
  draggingFile.x = x - offsetX;
  draggingFile.y = y - offsetY;
  
  // Set cursor to grabbing while dragging
  canvas.style.cursor = 'grabbing';
  
  // Find the current drop target for visual feedback
  currentDropTarget = findDropTarget(x, y, draggingFile, files);
  
  draw();
});

canvas.addEventListener("mouseup", (e) => {
  if (!draggingFile) return;
  
  // Save state before making changes for undo functionality
  saveState();
  
  const { x, y } = getMouse(e);

  const dropTarget = findDropTarget(x, y, draggingFile, files);
  if (dropTarget) {
    // Find and remove dragged file from its current parent
    const currentParentInfo = findParentOfComponent(draggingFile, files);
    if (currentParentInfo.parent) {
      // Remove from current parent and update its height
      removeFile(draggingFile, files);
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
      if (currentParentInfo.parent) {
        // Remove from current parent
        removeFile(draggingFile, files);
        
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
  
  // Check for Ctrl+click to duplicate
  if (e.ctrlKey || e.metaKey) {
    const clickedFile = findFileAtPosition(x, y, files);
    if (clickedFile) {
      saveState(); // Save state before duplication for undo
      duplicateComponent(clickedFile, x, y);
      return;
    }
  }
  
  // Then check if we selected a component
  const clickedFile = findFileAtPosition(x, y, files);
  if (clickedFile) {
    // Check if this is a top-level component or nested child
    const isTopLevel = files.includes(clickedFile);
    
    selectedFile = clickedFile;
    selectedChild = isTopLevel ? null : clickedFile; // Track if we selected a child
    openConfigDrawer(clickedFile);
    draw();
  } else {
    selectedFile = null;
    selectedChild = null;
    closeConfigDrawer();
    draw();
  }
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
  document.body.removeChild(input);
  if (!name) return;

  // Save state before adding new component for undo
  saveState();

  const file = {
    name,
    x,
    y,
    w: 160,
    h: 40,
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
  files.push(file);
  draw();
}

// ----------- Drawing -------------

function draw() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  files.forEach((file) => drawFile(file, 0));
  
  // Draw connections between components
  drawConnections();
  
  // Draw temporary connection while in connection mode
  if (isConnecting && connectionStart) {
    drawTemporaryConnection();
  }
  
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
  
  const padding = 10 + level * 20;
  
  // Calculate and set the proper width and height accounting for props and children
  let minWidth = Math.max(200, file.name.length * 12 + 60);
  
  // Calculate width needed for props display using ctx.measureText
  if (file.props && file.props.length > 0) {
    ctx.font = "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace";
    file.props.forEach(prop => {
      const value = prop.value || prop.name;
      const propText = `  ${prop.name}={${value}}`;
      const propWidth = ctx.measureText(propText).width;
      minWidth = Math.max(minWidth, propWidth + 100);
    });
  }
  
  // Calculate width needed for child components recursively
  if (file.children && file.children.length > 0 && file.expanded) {
    const childrenMaxWidth = calculateMaxChildWidth(file, padding + 30);
    minWidth = Math.max(minWidth, childrenMaxWidth);
  }
  
  file.w = minWidth;
  
  if (file.expanded) {
    updateParentHeight(file);
  } else {
    updateParentHeight(file); // This will calculate the correct height including props
  }

  // Create gradients for different component types (VS Code Omni Theme inspired)
  let gradient;
  if (file.isEventBox && file.type === 'INBOUND') {
    // Yellow gradient for inbound event boxes
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, "#ffd60a"); // Bright yellow
    gradient.addColorStop(1, "#ffbe0b"); // Darker yellow
  } else if (file.isEventBox && file.type === 'OUTBOUND') {
    // Pink gradient for outbound event boxes
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, "#ff6b9d"); // Bright pink
    gradient.addColorStop(1, "#ee5a6f"); // Darker pink
  } else if (file.type === COMPONENT_TYPES.HOOK) {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, "#2d3142"); // Dark blue-gray
    gradient.addColorStop(1, "#1e1e2e"); // Darker blue-gray
  } else if (file.type === COMPONENT_TYPES.PROVIDER) {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, "#2d3142"); // Dark blue-gray
    gradient.addColorStop(1, "#1e1e2e"); // Darker blue-gray
  } else {
    gradient = ctx.createLinearGradient(file.x, file.y, file.x + file.w, file.y + file.h);
    gradient.addColorStop(0, "#2d3142"); // Dark blue-gray
    gradient.addColorStop(1, "#1e1e2e"); // Darker blue-gray
  }

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(file.x + 2, file.y + 2, file.w, file.h, 8);
  ctx.fill();
  
  // Draw main component box with gradient
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(file.x, file.y, file.w, file.h, 8);
  ctx.fill();
  
  // Draw border with different styles for different states
  if (selectedFile === file) {
    // Check if this is a top-level component or a child
    const isTopLevel = files.includes(file);
    
    if (isTopLevel) {
      // Selected top-level component - blue
      ctx.strokeStyle = "#007acc";
      ctx.lineWidth = 3;
    } else {
      // Selected child component - bright cyan border with dashed pattern
      ctx.strokeStyle = "#00d4ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
    }
  } else if (hoveredFile === file && !draggingFile) {
    // Hover effect for non-selected components
    const isTopLevel = files.includes(file);
    
    if (!isTopLevel) {
      // Hovered child component - light cyan border
      ctx.strokeStyle = "#569cd6";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
    } else {
      // Hovered top-level component - light blue border
      ctx.strokeStyle = "#4a9eff";
      ctx.lineWidth = 2;
    }
  } else {
    // Normal component - subtle gray border (VS Code panel border)
    ctx.strokeStyle = "#3c3c3c";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
  }
  
  ctx.beginPath();
  ctx.roundRect(file.x, file.y, file.w, file.h, 8);
  ctx.stroke();
  
  // Reset line dash after drawing
  ctx.setLineDash([]);

  // Toggle symbol (only show if component has children or content AND is top-level)
  const hasContent = (file.children && file.children.length > 0) || 
                    (file.hooks && file.hooks.length > 0) ||
                    (file.innerHtml && file.innerHtml.trim());
  const isTopLevel = files.includes(file);
  
  if (hasContent && isTopLevel) {
    ctx.fillStyle = "#cccccc"; // VS Code light text
    ctx.font = "bold 16px sans-serif";
    const toggleSymbol = file.expanded ? "▾" : "▸";
    ctx.fillText(toggleSymbol, file.x + 8, file.y + 25);
  }

  // Component type indicator (top right)
  ctx.fillStyle = "#6a9955"; // VS Code string/comment green
  ctx.font = "bold 10px sans-serif";
  ctx.fillText(file.type.toUpperCase(), file.x + file.w - 70, file.y + 15);

  // Special rendering for event boxes
  if (file.isEventBox) {
    // Draw event box title (event name) in bold
    const textColor = file.type === 'INBOUND' ? "#2d2d30" : "#ffffff"; // Dark text for yellow, white for pink
    ctx.fillStyle = textColor;
    ctx.font = "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace";
    ctx.fillText(file.name || 'Event', file.x + 10, file.y + 25);
    
    // Draw event description in gray/lighter color
    if (file.description && file.description.trim()) {
      ctx.fillStyle = file.type === 'INBOUND' ? "#666666" : "#dddddd"; // Darker gray for yellow, lighter for pink
      ctx.font = "12px 'Fira Code', 'Monaco', 'Menlo', monospace";
      ctx.fillText(file.description, file.x + 10, file.y + 45);
    }
    
    return; // Skip the rest of the component rendering for event boxes
  }

  // Check if component has children
  const hasChildren = file.children && file.children.length > 0;
  const hasInnerHtml = file.innerHtml && file.innerHtml.trim();
  // A component should be self-closing if it has no children, no hooks, and no inner HTML
   if (!hasChildren && (!file.hooks || file.hooks.length === 0) && !hasInnerHtml) {
    // Draw as self-closing tag for components with no children, props, or hooks
    ctx.fillStyle = "#569cd6"; // VS Code keyword blue
    ctx.font = "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace";

    // Check if we have props to display
    const hasProps = (file.props && file.props.length > 0);
    
    if (hasProps) {
      // Draw opening tag first - component name in blue
      ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
      ctx.fillText(`<${file.name}`, file.x + padding + 20, file.y + 30);
      
      let lineOffset = 25;
      
      // Draw props on separate lines
      if (file.props && file.props.length > 0) {
        file.props.forEach(prop => {
          const value = prop.value || prop.name;
          // Prop name in light blue, value in orange
          ctx.fillStyle = "#9cdcfe"; // VS Code parameter blue
          ctx.fillText(`  ${prop.name}`, file.x + padding + 20, file.y + 30 + lineOffset);
          let currentX = file.x + padding + 20 + ctx.measureText(`  ${prop.name}`).width;
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for =
          ctx.fillText(`=`, currentX, file.y + 30 + lineOffset);
          currentX += ctx.measureText(`=`).width;
          ctx.fillStyle = "#ce9178"; // VS Code string orange
          ctx.fillText(`{${value}}`, currentX, file.y + 30 + lineOffset);
          lineOffset += 20;
        });
      }
      
      // Draw closing part of self-closing tag
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue
      ctx.fillText(`/>`, file.x + padding + 20, file.y + 30 + lineOffset);
    } else {
      // Simple self-closing tag without props
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
      ctx.fillText(`<`, file.x + padding + 20, file.y + 30);
      ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal for component name
      ctx.fillText(`${file.name}`, file.x + padding + 29, file.y + 30);
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for closing
      ctx.fillText(` />`, file.x + padding + 29 + file.name.length * 10, file.y + 30);
    }
  } else {
    // Draw as opening tag
    ctx.font = "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace";
    
    // Check if we have props to display
    const hasProps = (file.props && file.props.length > 0);
    
    if (hasProps) {
      // Draw opening tag first - component name in teal
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for <
      ctx.fillText(`<`, file.x + padding + 20, file.y + 30);
      ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
      ctx.fillText(`${file.name}`, file.x + padding + 29, file.y + 30);
      
      let lineOffset = 25;
      
      // Draw props on separate lines
      if (file.props && file.props.length > 0) {
        file.props.forEach(prop => {
          const value = prop.value || prop.name;
          // Prop name in light blue, value in orange
          ctx.fillStyle = "#9cdcfe"; // VS Code parameter blue
          ctx.fillText(`  ${prop.name}`, file.x + padding + 20, file.y + 30 + lineOffset);
          let currentX = file.x + padding + 20 + ctx.measureText(`  ${prop.name}`).width;
          ctx.fillStyle = "#569cd6"; // VS Code keyword blue for =
          ctx.fillText(`=`, currentX, file.y + 30 + lineOffset);
          currentX += ctx.measureText(`=`).width;
          ctx.fillStyle = "#ce9178"; // VS Code string orange
          ctx.fillText(`{${value}}`, currentX, file.y + 30 + lineOffset);
          lineOffset += 20;
        });
      }
      
      // Draw closing part of opening tag
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue
      ctx.fillText(`>`, file.x + padding + 20, file.y + 30 + lineOffset);
    } else {
      // Simple opening tag without props
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
      ctx.fillText(`<`, file.x + padding + 20, file.y + 30);
      ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal for component name
      ctx.fillText(`${file.name}`, file.x + padding + 29, file.y + 30);
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for closing
      ctx.fillText(`>`, file.x + padding + 29 + file.name.length * 10, file.y + 30);
    }

    if (file.expanded) {
      let offsetY = file.y + 60;
      
      // Account for multi-line props in the opening tag
      const hasProps = (file.props && file.props.length > 0);
      if (hasProps) {
        const propsCount = file.props ? file.props.length : 0;
        offsetY += propsCount * 20 + 20; // Add space for props lines + closing >
      }

      // Draw inner HTML content if it exists
      if (file.innerHtml && file.innerHtml.trim()) {
        ctx.fillStyle = "#ce9178"; // VS Code string orange for inner content
        ctx.font = "12px 'Fira Code', 'Monaco', 'Menlo', monospace";
        
        // Split inner HTML by lines and render each line
        const innerHtmlLines = file.innerHtml.split('\n');
        innerHtmlLines.forEach(line => {
          if (line.trim()) {
            ctx.fillText(`  ${line}`, file.x + padding + 25, offsetY);
            offsetY += 16;
          } else {
            offsetY += 12; // Small gap for empty lines
          }
        });
        offsetY += 10; // Extra space after inner HTML
      }

      // Draw hooks if any
      if (file.hooks && file.hooks.length > 0) {
        ctx.fillStyle = "#6a9955"; // VS Code comment green
        ctx.font = "bold 12px 'Fira Code', sans-serif";
        ctx.fillText("// Hooks:", file.x + padding + 25, offsetY);
        offsetY += 16;
        file.hooks.forEach(hook => {
          ctx.fillStyle = "#dcdcaa"; // VS Code function yellow
          ctx.font = "11px 'Fira Code', 'Monaco', 'Menlo', monospace";
          ctx.fillText(`• ${hook}`, file.x + padding + 35, offsetY);
          offsetY += 14;
        });
        offsetY += 10;
      }

      // Draw child components as JSX elements inside the parent
      if (file.children && file.children.length > 0) {
        file.children.forEach((child, index) => {
          // Skip drawing this child if it's currently being dragged
          if (draggingFile === child) {
            return;
          }
          
          const childPadding = padding + 30;
          
          // Calculate hit detection area accounting for multi-line props
          const hasChildProps = (child.props && child.props.length > 0);
          let childHeight = 25; // Default height
          
          if (hasChildProps) {
            const propsCount = child.props ? child.props.length : 0;
            childHeight = 20 + propsCount * 20 + 25; // Opening + props + closing
          }
          
          // Set position and dimensions for all child components for hit detection
          child.x = file.x + childPadding;
          child.y = offsetY - 18; // Adjust for text baseline
          
          // Calculate width accounting for props using ctx.measureText
          let childWidth = Math.max(120, child.name.length * 10 + 40);
          
          // Set font for accurate measurements
          ctx.font = "bold 14px 'Fira Code', 'Monaco', 'Menlo', monospace";
          
          // Account for props width
          if (child.props && child.props.length > 0) {
            child.props.forEach(prop => {
              const value = prop.value || prop.name;
              const propText = `  ${prop.name}={${value}}`;
              const propWidth = ctx.measureText(propText).width;
              childWidth = Math.max(childWidth, propWidth + 20);
            });
          }
          
          child.w = childWidth;
          child.h = childHeight;
          
          // Draw selection highlight for child components
          if (selectedFile === child) {
            ctx.fillStyle = "rgba(0, 204, 255, 0.2)";
            ctx.beginPath();
            ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
            ctx.fill();
            
            ctx.strokeStyle = "#00ccff";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 2]);
            ctx.beginPath();
            ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (hoveredFile === child && !draggingFile) {
            // Hover effect for child components
            ctx.fillStyle = "rgba(136, 221, 255, 0.1)";
            ctx.beginPath();
            ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
            ctx.fill();
            
            ctx.strokeStyle = "#88ddff";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          
          // Draw child as JSX text
          ctx.font = "bold 14px 'Fira Code', 'Monaco', 'Menlo', monospace";
          
          const childHasChildren = child.children && child.children.length > 0;
          
          if (childHasChildren) {
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
            
            // Recursively draw children
            offsetY = drawChildrenAsJSX(child, childPadding + 20, offsetY, file.x);
            
            // Draw closing tag
            ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
            ctx.fillText(`</`, child.x, offsetY);
            ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
            ctx.fillText(`${child.name}`, child.x + 18, offsetY);
            ctx.fillStyle = "#569cd6"; // VS Code keyword blue
            ctx.fillText(`>`, child.x + 18 + child.name.length * 10, offsetY);
            offsetY += 25;
          } else {
            // Draw as self-closing tag for simple components
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
              ctx.fillText(` />`, child.x + 9 + child.name.length * 10, offsetY);
              offsetY += 25;
            }
          }
        });
      }

      // JSX closing tag (only if component has content)
      ctx.font = "bold 16px 'Fira Code', 'Monaco', 'Menlo', monospace";
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
      ctx.fillText(`</`, file.x + padding + 20, offsetY + 15);
      ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
      ctx.fillText(`${file.name}`, file.x + padding + 38, offsetY + 15);
      ctx.fillStyle = "#569cd6"; // VS Code keyword blue
      ctx.fillText(`>`, file.x + padding + 38 + file.name.length * 10, offsetY + 15);
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
        connections = projectData.connections;
      }
      console.log('Loaded project from localStorage');
      return true;
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return false;
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
    } else if (selectedFile) {
      // Delete selected component
      saveState(); // Save state before deletion for undo
      removeFile(selectedFile, files);
      selectedFile = null;
      selectedChild = null;
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
      isConnecting = false;
      connectionStart = null;
      canvas.style.cursor = 'default';
      
      // Reset connection button state
      const connectionBtn = document.getElementById('connectionModeBtn');
      connectionBtn.classList.remove('active');
      connectionBtn.style.background = '';
      connectionBtn.style.color = '';
    }
    
    selectedFile = null;
    selectedChild = null;
    selectedConnection = null;
    draw();
  }
});

// ----------- Toolbar Functions -------------

function clearCanvas() {
  if (confirm('Are you sure you want to clear all components? This cannot be undone.')) {
    saveState(); // Save state before clearing for undo
    files = [];
    connections = []; // Clear all connections
    selectedFile = null;
    selectedChild = null;
    selectedConnection = null;
    hoveredFile = null;
    draw();
  }
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
  const parentList = findParentList(originalFile, files);
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
    
    // Add consistent padding like other width calculations (same as used for props: +100)
    maxWidth = Math.max(maxWidth, childRequiredWidth + 100);
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
  
  let totalHeight = 60; // Header with new larger size
  
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
  
  totalHeight += 40; // Closing tag space and padding
  parentComponent.h = totalHeight;
}

// ----------- Undo Functionality -------------

function saveState() {
  // Deep clone the current state
  const state = {
    files: JSON.parse(JSON.stringify(files)),
    connections: JSON.parse(JSON.stringify(connections)),
    selectedFile: selectedFile,
    selectedChild: selectedChild
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
  connections = previousState.connections || []; // Handle backward compatibility
  selectedFile = previousState.selectedFile;
  selectedChild = previousState.selectedChild;
  
  draw();
}

// ----------- Recursive Utilities -------------

function findFileAtPosition(x, y, list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const file = list[i];
    
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
  // First check nested components (deeper components take priority)
  for (const file of list) {
    if (file !== draggedFile && file.children && file.children.length > 0) {
      const nested = findDropTarget(x, y, draggedFile, file.children);
      if (nested) return nested;
    }
  }
  
  // Then check current level components
  for (const file of list) {
    if (
      file !== draggedFile &&
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
        x: file.x + 8,
        y: file.y + 8,
        w: 20,
        h: 20,
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
        x: file.x + 8,
        y: file.y + 8,
        w: 20,
        h: 20,
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
  const indicatorWidth = Math.max(150, draggedComponent.name.length * 10 + 40);
  const indicatorHeight = 35;
  
  // Position at current drag location
  const indicatorX = draggedComponent.x;
  const indicatorY = draggedComponent.y;
  
  // Draw shadow for the drag indicator
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(indicatorX + 3, indicatorY + 3, indicatorWidth, indicatorHeight, 8);
  ctx.fill();
  
  // Create gradient for the drag indicator (VS Code theme)
  let gradient = ctx.createLinearGradient(indicatorX, indicatorY, indicatorX + indicatorWidth, indicatorY + indicatorHeight);
  
  // Use consistent VS Code dark theme colors for all component types
  gradient.addColorStop(0, "#2d3142"); // Dark blue-gray
  gradient.addColorStop(1, "#1e1e2e"); // Darker blue-gray
  
  // Draw the main drag indicator box
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, 8);
  ctx.fill();
  
  // Draw border for drag indicator
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw component name in the drag indicator with VS Code colors
  ctx.fillStyle = "#569cd6"; // VS Code keyword blue for brackets
  ctx.fillText(`<`, indicatorX + 10, indicatorY + 22);
  ctx.fillStyle = "#4ec9b0"; // VS Code type/class teal
  ctx.fillText(`${draggedComponent.name}`, indicatorX + 19, indicatorY + 22);
  ctx.fillStyle = "#569cd6"; // VS Code keyword blue
  ctx.fillText(` />`, indicatorX + 19 + draggedComponent.name.length * 10, indicatorY + 22);
  
  // Add a small drag icon
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "12px sans-serif";
  ctx.fillText("⌖", indicatorX + indicatorWidth - 20, indicatorY + 20);
  
  // Restore original alpha
  ctx.globalAlpha = originalAlpha;
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
      
      // Calculate hit detection area accounting for multi-line props and inner HTML
      const hasChildProps = (child.props && child.props.length > 0);
      const childHasInnerHtml = child.innerHtml && child.innerHtml.trim();
      let childHeight = 25; // Default height
      
      if (hasChildProps) {
        const propsCount = child.props ? child.props.length : 0;
        childHeight = 20 + propsCount * 20 + 25; // Opening + props + closing
      }
      
      // Add height for inner HTML content
      if (childHasInnerHtml) {
        const innerHtmlLines = child.innerHtml.split('\n');
        const contentLines = innerHtmlLines.filter(line => line.trim()).length;
        const emptyLines = innerHtmlLines.length - contentLines;
        childHeight += (contentLines * 16) + (emptyLines * 12); // 16px per content line, 12px per empty line
      }
      
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
      child.h = childHeight;
      
      // Draw selection highlight for nested child components
      if (selectedFile === child) {
        ctx.fillStyle = "rgba(0, 204, 255, 0.2)";
        ctx.beginPath();
        ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
        ctx.fill();
        
        ctx.strokeStyle = "#00ccff";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (hoveredFile === child && !draggingFile) {
        // Hover effect for nested child components
        ctx.fillStyle = "rgba(136, 221, 255, 0.1)";
        ctx.beginPath();
        ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
        ctx.fill();
        
        ctx.strokeStyle = "#88ddff";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.roundRect(child.x - 5, child.y - 2, child.w + 10, child.h, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
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
              ctx.fillStyle = "#ce9178"; // VS Code string orange for content
              ctx.font = "14px 'Fira Code', 'Monaco', 'Menlo', monospace";
              ctx.fillText(`  ${line.trim()}`, child.x, offsetY);
              offsetY += 16;
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

// ----------- Configuration Drawer Functions -------------

function openConfigDrawer(component) {
  const drawer = document.getElementById('configDrawer');
  drawer.classList.add('open');
  
  // Populate component name
  document.getElementById('componentName').value = component.name;
  
  // Populate inner HTML
  document.getElementById('innerHtml').value = component.innerHtml || '';
  
  // Populate props
  const propsList = document.getElementById('propsList');
  propsList.innerHTML = '';
  if (component.props && component.props.length > 0) {
    component.props.forEach((prop, index) => {
      addPropToDOM(prop.name, prop.value || '', index);
    });
  }
  
  // Populate events
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  if (component.events && component.events.length > 0) {
    component.events.forEach((event, index) => {
      addEventToDOM(event.name, event.description || '', index);
    });
  }
}

function closeConfigDrawer() {
  const drawer = document.getElementById('configDrawer');
  drawer.classList.remove('open');
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

function addEvent() {
  if (!selectedFile) return;
  
  const index = selectedFile.events ? selectedFile.events.length : 0;
  addEventToDOM('', '', index);
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function addEventToDOM(name, description, index) {
  const eventsList = document.getElementById('eventsList');
  
  const eventItem = document.createElement('div');
  eventItem.className = 'prop-item'; // Reuse prop-item styling
  eventItem.innerHTML = `
    <input type="text" class="form-input" placeholder="Event name" value="${name}" 
           onchange="updateEvent(${index}, 'name', this.value)">
    <input type="text" class="form-input prop-value" placeholder="Description (optional)" value="${description}" 
           onchange="updateEvent(${index}, 'description', this.value)">
    <button class="remove-btn" onclick="removeEvent(${index})">×</button>
  `;
  
  eventsList.appendChild(eventItem);
  
  // Initialize event in component if it doesn't exist
  if (selectedFile) {
    if (!selectedFile.events) selectedFile.events = [];
    if (!selectedFile.events[index]) {
      selectedFile.events[index] = { name: name, description: description };
    }
  }
}

function updateEvent(index, field, value) {
  if (!selectedFile || !selectedFile.events || !selectedFile.events[index]) return;
  
  const oldEventName = selectedFile.events[index].name;
  
  saveState(); // Save state before change for undo
  selectedFile.events[index][field] = value;
  
  // If we're updating the event name, we need to update the corresponding prop
  if (field === 'name') {
    if (!selectedFile.props) selectedFile.props = [];
    
    // Remove old prop if it exists
    if (oldEventName) {
      selectedFile.props = selectedFile.props.filter(prop => prop.name !== oldEventName);
    }
    
    // Add new prop with {event} value if new name is not empty
    if (value.trim()) {
      const existingPropIndex = selectedFile.props.findIndex(prop => prop.name === value);
      if (existingPropIndex === -1) {
        selectedFile.props.push({ name: value, value: '{event}' });
      } else {
        // Update existing prop to have {event} value
        selectedFile.props[existingPropIndex].value = '{event}';
      }
    }
    
    // Refresh the props list to show the new prop
    const propsList = document.getElementById('propsList');
    propsList.innerHTML = '';
    if (selectedFile.props && selectedFile.props.length > 0) {
      selectedFile.props.forEach((prop, propIndex) => {
        addPropToDOM(prop.name, prop.value || '', propIndex);
      });
    }
  }
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function removeEvent(index) {
  if (!selectedFile || !selectedFile.events) return;
  
  saveState(); // Save state before change for undo
  
  // Get the event name before removing it
  const eventName = selectedFile.events[index].name;
  
  // Remove the event
  selectedFile.events.splice(index, 1);
  
  // Remove corresponding prop if it exists
  if (eventName && selectedFile.props) {
    selectedFile.props = selectedFile.props.filter(prop => prop.name !== eventName || prop.value !== '{event}');
    
    // Refresh the props list
    const propsList = document.getElementById('propsList');
    propsList.innerHTML = '';
    if (selectedFile.props && selectedFile.props.length > 0) {
      selectedFile.props.forEach((prop, propIndex) => {
        addPropToDOM(prop.name, prop.value || '', propIndex);
      });
    }
  }
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  // Refresh the events list
  openConfigDrawer(selectedFile);
  draw();
}

// Close drawer when clicking outside
document.addEventListener('click', (e) => {
  const drawer = document.getElementById('configDrawer');
  const canvas = document.getElementById('board');
  
  if (drawer.classList.contains('open') && 
      !drawer.contains(e.target) && 
      canvas.contains(e.target)) {
    // Don't close if we're clicking on a component (that would open it again)
    const { x, y } = getMouse(e);
    const clickedFile = findFileAtPosition(x, y, files);
    if (!clickedFile) {
      closeConfigDrawer();
    }
  }
});

// Close drawer with Escape key handled in main keydown listener above

canvas.addEventListener("mouseleave", (e) => {
  // Reset cursor and hover state when mouse leaves canvas
  canvas.style.cursor = 'default';
  hoveredFile = null;
  draw();
});

// Load from localStorage and then draw
loadFromLocalStorage();
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

function addInboundEvent() {
  // Find the center of the canvas for initial placement
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  saveState(); // Save state before adding for undo
  
  // Create a new inbound event box
  const eventBox = {
    name: 'NewInbound',
    description: 'Inbound event description',
    x: centerX - 100,
    y: centerY - 30,
    w: 200,
    h: 60,
    type: 'INBOUND',
    isEventBox: true,
    parentComponent: null
  };
  
  files.push(eventBox);
  selectedFile = eventBox;
  draw();
}

function addOutboundEvent() {
  // Find the center of the canvas for initial placement
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  saveState(); // Save state before adding for undo
  
  // Create a new outbound event box
  const eventBox = {
    name: 'NewOutbound',
    description: 'Outbound event description',
    x: centerX - 100,
    y: centerY - 30,
    w: 200,
    h: 60,
    type: 'OUTBOUND',
    isEventBox: true,
    parentComponent: null
  };
  
  files.push(eventBox);
  selectedFile = eventBox;
  draw();
}

// ----------- Connection System Functions -------------

function toggleConnectionMode() {
  isConnecting = !isConnecting;
  const connectionBtn = document.getElementById('connectionModeBtn');
  
  if (isConnecting) {
    connectionStart = null;
    canvas.style.cursor = 'crosshair';
    selectedFile = null;
    selectedChild = null;
    selectedConnection = null;
    connectionBtn.classList.add('active');
    connectionBtn.style.background = 'linear-gradient(135deg, #007acc 0%, #0099ff 100%)';
    connectionBtn.style.color = 'white';
  } else {
    connectionStart = null;
    canvas.style.cursor = 'default';
    connectionBtn.classList.remove('active');
    connectionBtn.style.background = '';
    connectionBtn.style.color = '';
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
    // Update connection points in case components moved
    connection.fromPoint = getConnectionPoint(connection.from, connection.to);
    connection.toPoint = getConnectionPoint(clickedFile, connectionStart);
    
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
  
  // Draw the line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // Draw arrowhead
  const headLength = 12;
  const headAngle = Math.PI / 6;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - headAngle),
    toY - headLength * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + headAngle),
    toY - headLength * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function findConnectionAtPosition(x, y) {
  const tolerance = 8; // Tolerance for clicking on connection lines
  
  for (const connection of connections) {
    if (isPointNearLine(
      x, y,
      connection.fromPoint.x, connection.fromPoint.y,
      connection.toPoint.x, connection.toPoint.y,
      tolerance
    )) {
      return connection;
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

// ----------- Toolbar Functions -------------

function openConfigDrawer(component) {
  const drawer = document.getElementById('configDrawer');
  drawer.classList.add('open');
  
  // Populate component name
  document.getElementById('componentName').value = component.name;
  
  // Populate inner HTML
  document.getElementById('innerHtml').value = component.innerHtml || '';
  
  // Populate props
  const propsList = document.getElementById('propsList');
  propsList.innerHTML = '';
  if (component.props && component.props.length > 0) {
    component.props.forEach((prop, index) => {
      addPropToDOM(prop.name, prop.value || '', index);
    });
  }
  
  // Populate events
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  if (component.events && component.events.length > 0) {
    component.events.forEach((event, index) => {
      addEventToDOM(event.name, event.description || '', index);
    });
  }
}

function closeConfigDrawer() {
  const drawer = document.getElementById('configDrawer');
  drawer.classList.remove('open');
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

function addEvent() {
  if (!selectedFile) return;
  
  const index = selectedFile.events ? selectedFile.events.length : 0;
  addEventToDOM('', '', index);
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function addEventToDOM(name, description, index) {
  const eventsList = document.getElementById('eventsList');
  
  const eventItem = document.createElement('div');
  eventItem.className = 'prop-item'; // Reuse prop-item styling
  eventItem.innerHTML = `
    <input type="text" class="form-input" placeholder="Event name" value="${name}" 
           onchange="updateEvent(${index}, 'name', this.value)">
    <input type="text" class="form-input prop-value" placeholder="Description (optional)" value="${description}" 
           onchange="updateEvent(${index}, 'description', this.value)">
    <button class="remove-btn" onclick="removeEvent(${index})">×</button>
  `;
  
  eventsList.appendChild(eventItem);
  
  // Initialize event in component if it doesn't exist
  if (selectedFile) {
    if (!selectedFile.events) selectedFile.events = [];
    if (!selectedFile.events[index]) {
      selectedFile.events[index] = { name: name, description: description };
    }
  }
}

function updateEvent(index, field, value) {
  if (!selectedFile || !selectedFile.events || !selectedFile.events[index]) return;
  
  const oldEventName = selectedFile.events[index].name;
  
  saveState(); // Save state before change for undo
  selectedFile.events[index][field] = value;
  
  // If we're updating the event name, we need to update the corresponding prop
  if (field === 'name') {
    if (!selectedFile.props) selectedFile.props = [];
    
    // Remove old prop if it exists
    if (oldEventName) {
      selectedFile.props = selectedFile.props.filter(prop => prop.name !== oldEventName);
    }
    
    // Add new prop with {event} value if new name is not empty
    if (value.trim()) {
      const existingPropIndex = selectedFile.props.findIndex(prop => prop.name === value);
      if (existingPropIndex === -1) {
        selectedFile.props.push({ name: value, value: '{event}' });
      } else {
        // Update existing prop to have {event} value
        selectedFile.props[existingPropIndex].value = '{event}';
      }
    }
    
    // Refresh the props list to show the new prop
    const propsList = document.getElementById('propsList');
    propsList.innerHTML = '';
    if (selectedFile.props && selectedFile.props.length > 0) {
      selectedFile.props.forEach((prop, propIndex) => {
        addPropToDOM(prop.name, prop.value || '', propIndex);
      });
    }
  }
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  draw();
}

function removeEvent(index) {
  if (!selectedFile || !selectedFile.events) return;
  
  saveState(); // Save state before change for undo
  
  // Get the event name before removing it
  const eventName = selectedFile.events[index].name;
  
  // Remove the event
  selectedFile.events.splice(index, 1);
  
  // Remove corresponding prop if it exists
  if (eventName && selectedFile.props) {
    selectedFile.props = selectedFile.props.filter(prop => prop.name !== eventName || prop.value !== '{event}');
    
    // Refresh the props list
    const propsList = document.getElementById('propsList');
    propsList.innerHTML = '';
    if (selectedFile.props && selectedFile.props.length > 0) {
      selectedFile.props.forEach((prop, propIndex) => {
        addPropToDOM(prop.name, prop.value || '', propIndex);
      });
    }
  }
  
  // Recalculate component height and repositioning
  updateParentHeight(selectedFile);
  
  // If this component has a parent, update the parent's height too
  const parentList = findParentOfComponent(selectedFile, files);
  if (parentList.parent) {
    repositionChildrenInParent(parentList.parent);
  }
  
  // Refresh the events list
  openConfigDrawer(selectedFile);
  draw();
}

// Close drawer when clicking outside
document.addEventListener('click', (e) => {
  const drawer = document.getElementById('configDrawer');
  const canvas = document.getElementById('board');
  
  if (drawer.classList.contains('open') && 
      !drawer.contains(e.target) && 
      canvas.contains(e.target)) {
    // Don't close if we're clicking on a component (that would open it again)
    const { x, y } = getMouse(e);
    const clickedFile = findFileAtPosition(x, y, files);
    if (!clickedFile) {
      closeConfigDrawer();
    }
  }
});

// Close drawer with Escape key handled in main keydown listener above

canvas.addEventListener("mouseleave", (e) => {
  // Reset cursor and hover state when mouse leaves canvas
  canvas.style.cursor = 'default';
  hoveredFile = null;
  draw();
});

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

function addInboundEvent() {
  // Find the center of the canvas for initial placement
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  saveState(); // Save state before adding for undo
  
  // Create a new inbound event box
  const eventBox = {
    name: 'NewInbound',
    description: 'Inbound event description',
    x: centerX - 100,
    y: centerY - 30,
    w: 200,
    h: 60,
    type: 'INBOUND',
    isEventBox: true,
    parentComponent: null
  };
  
  files.push(eventBox);
  selectedFile = eventBox;
  draw();
}

function addOutboundEvent() {
  // Find the center of the canvas for initial placement
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  saveState(); // Save state before adding for undo
  
  // Create a new outbound event box
  const eventBox = {
    name: 'NewOutbound',
    description: 'Outbound event description',
    x: centerX - 100,
    y: centerY - 30,
    w: 200,
    h: 60,
    type: 'OUTBOUND',
    isEventBox: true,
    parentComponent: null
  };
  
  files.push(eventBox);
  selectedFile = eventBox;
  draw();
}
