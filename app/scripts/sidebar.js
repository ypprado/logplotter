// Define the sidebar configurations
const sidebarConfigurations = {
    main: 'mainConfig',
    brush: 'brushConfig',
    gear: 'gearConfig'
};

// Function to toggle between different sidebar configurations
function toggleSidebarContent(configType) {
    // Hide all sidebar contents first
    const allConfigContents = document.querySelectorAll('.sidebar-content');
    allConfigContents.forEach(content => {
        content.classList.remove('active');
    });

    // Show the requested configuration
    const configToShow = sidebarConfigurations[configType];
    const contentToShow = document.getElementById(configToShow);
    if (contentToShow) {
        contentToShow.classList.add('active');
    }
}

// Example function to handle specific display of configuration (e.g., for Brush)
function displayConfigurationControls(data) {
    const configContainer = document.getElementById('lineConfigurations');
    configContainer.innerHTML = '';

    data.forEach((trace, index) => {
        const lineConfig = document.createElement('div');
        lineConfig.classList.add('line-config');
        const lineWidth = trace.line && trace.line.width ? trace.line.width : 2;
        const markerSize = trace.marker && trace.marker.size ? trace.marker.size : 6;
        const assignedYAxis = trace.yaxis || "y"; // Default to Y-axis 1
        //const traceColor = trace.line && trace.line.color ? trace.line.color : 'rgb(0, 0, 0)'; // Default black

        lineConfig.innerHTML = `
        <!-- Signal Name with Dynamic Color -->
        <label>
            <span class="signal-name" data-index="${index}" style="color:#000; font-weight: bold;">${trace.name}</span>
        </label>
    
        <!-- Trace Color Picker (Color Swatches) -->
        <label>Trace Color</label>
        <div class="color-palette" data-index="${index}">
            <!-- Blue Shades -->
            <div class="color-swatch" style="background-color:rgb(100, 149, 237);" data-color="rgb(100, 149, 237)"></div> <!-- Soft Blue -->
            <div class="color-swatch" style="background-color:rgb(70, 130, 180);" data-color="rgb(70, 130, 180)"></div> <!-- Medium Blue -->
            <div class="color-swatch" style="background-color:rgb(30, 60, 120);" data-color="rgb(30, 60, 120)"></div> <!-- Dark Blue -->
            
            <!-- Green Shades -->
            <div class="color-swatch" style="background-color:rgb(144, 238, 144);" data-color="rgb(144, 238, 144)"></div> <!-- Soft Green -->
            <div class="color-swatch" style="background-color:rgb(60, 179, 113);" data-color="rgb(60, 179, 113)"></div> <!-- Medium Sea Green -->
            <div class="color-swatch" style="background-color:rgb(34, 139, 34);" data-color="rgb(34, 139, 34)"></div> <!-- Dark Green -->
            
            <!-- Red Shades -->
            <div class="color-swatch" style="background-color:rgb(205, 92, 92);" data-color="rgb(205, 92, 92)"></div> <!-- Soft Red -->
            <div class="color-swatch" style="background-color:rgb(255, 99, 71);" data-color="rgb(255, 99, 71)"></div> <!-- Tomato Red -->
            <div class="color-swatch" style="background-color:rgb(139, 0, 0);" data-color="rgb(139, 0, 0)"></div> <!-- Dark Red -->
            
            <!-- Violet Shades -->
            <div class="color-swatch" style="background-color:rgb(186, 85, 211);" data-color="rgb(186, 85, 211)"></div> <!-- Soft Purple -->
            <div class="color-swatch" style="background-color:rgb(138, 43, 226);" data-color="rgb(138, 43, 226)"></div> <!-- Blue Violet -->
            <div class="color-swatch" style="background-color:rgb(75, 0, 130);" data-color="rgb(75, 0, 130)"></div> <!-- Dark Violet -->
            
            <!-- Gray Shades -->
            <div class="color-swatch" style="background-color:rgb(169, 169, 169);" data-color="rgb(169, 169, 169)"></div> <!-- Gray -->
            <div class="color-swatch" style="background-color:rgb(105, 105, 105);" data-color="rgb(105, 105, 105)"></div> <!-- Dark Gray -->
            
            <!-- Black -->
            <div class="color-swatch" style="background-color:rgb(0, 0, 0);" data-color="rgb(0, 0, 0)"></div> <!-- Black -->
        </div>
        
        <hr class="separator">

        <!-- Mode Selector -->
        <div class="mode-selector-container">
            <label>Mode</label>
            <select class="line-mode" data-index="${index}">
                <option value="lines" ${trace.mode === 'lines' ? 'selected' : ''}>Lines</option>
                <option value="markers" ${trace.mode === 'markers' ? 'selected' : ''}>Markers</option>
                <option value="lines+markers" ${trace.mode === 'lines+markers' ? 'selected' : ''}>Lines + Markers</option>
            </select>
        </div>
    
        <!-- Main container for the two groups -->
        <div class="main-container">
            <!-- First group (Line Width) -->
            <div class="group-container">
                <!-- Label and Span container -->
                <div class="label-span-container">
                    <label for="lineWidth">Line Width:</label>
                    <span class="line-width-value">${lineWidth}</span>
                </div>
                <!-- Range container -->
                <input type="range" id="lineWidth" class="line-width" data-index="${index}" min="1" max="10" value="${lineWidth}" />
            </div>
        
            <!-- Second group (Marker Size) -->
            <div class="group-container">
                <!-- Label and Span container -->
                <div class="label-span-container">
                    <label for="markerSize">Marker Size:</label>
                    <span class="marker-size-value">${markerSize}</span>
                </div>
                <!-- Range container -->
                <input type="range" id="markerSize" class="marker-size" data-index="${index}" min="1" max="10" value="${markerSize}" />
            </div>
        </div>

        <hr class="separator">

        <!-- Y-Axis Selector -->
        <div class="y-axis-selector-container">
            <label>Y-Axis</label>
            <select class="y-axis-selector" data-index="${index}">
                <option value="y1" ${assignedYAxis === "y1" ? "selected" : ""}>Y1 (Primary)</option>
                <option value="y2" ${assignedYAxis === "y2" ? "selected" : ""}>Y2 (Secondary)</option>
                <option value="y3" ${assignedYAxis === "y3" ? "selected" : ""}>Y3 (Right side)</option>
            </select>
        </div>

        <!-- Min and Max Input Fields -->
        <div class="min-max-container">
            <label for="min-value">Min:</label>
            <input type="number" id="min-value" class="min-input" data-index="${index}" />
            <label for="max-value">Max:</label>
            <input type="number" id="max-value" class="max-input" data-index="${index}" />
        </div>
        `;
        configContainer.appendChild(lineConfig);
    });
    addConfigListeners();
}



/******************** Resize Sidebar  ********************/
const sidebar = document.querySelector('.sidebar');
const content = document.querySelector('.content'); // Select the content area
const container = document.querySelector('.container'); // Select the container

let isResizing = false;
let throttleTimeout = null;

// Listen for the window resize event
window.addEventListener('resize', adjustSidebarOnResize);

function adjustSidebarOnResize() {
    // Ensure the sidebar stays proportional to the container
    const containerWidth = container.offsetWidth;
    const sidebarWidth = sidebar.offsetWidth;
    const sidebarRatio = sidebarWidth / containerWidth;

    const newSidebarWidth = containerWidth * sidebarRatio;
    const minWidth = 200; // Minimum sidebar width
    const maxWidth = 600; // Maximum sidebar width

    if (newSidebarWidth >= minWidth && newSidebarWidth <= maxWidth) {
        sidebar.style.width = `${newSidebarWidth}px`; // Adjust sidebar width
        content.style.width = `calc(100% - ${newSidebarWidth}px)`; // Adjust content width
    }
}

// Existing resizing logic for manual adjustment
const resizeHandle = document.getElementById('resizeHandle');
resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none'; // Disable text selection
    document.addEventListener('mousemove', throttledResizeSidebar);
    document.addEventListener('mouseup', stopResize);
});

function throttledResizeSidebar(e) {
    if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
            resizeSidebar(e);
            throttleTimeout = null; // Reset the timeout
        }, 16); // ~60fps (16ms interval)
    }
}

function resizeSidebar(e) {
    if (!isResizing) return;

    const containerOffset = container.getBoundingClientRect().left;
    const newWidth = e.clientX - containerOffset;

    const minWidth = 200;
    const maxWidth = 600;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
        sidebar.style.width = `${newWidth}px`;
        content.style.width = `calc(100% - ${newWidth}px)`;
    }
}

function stopResize() {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = ''; // Re-enable text selection
    document.removeEventListener('mousemove', throttledResizeSidebar);
    document.removeEventListener('mouseup', stopResize);
}

/******************** Resize Sources checkbox  ********************/

const sourcesContainer = document.getElementById('checkbox-sources');
const signalsContainer = document.getElementById('checkbox-signals');
const resizeHandleSources = document.getElementById('resizeHandleSources');

let isResizingSources = false;

resizeHandleSources.addEventListener('mousedown', (e) => {
    isResizingSources = true;
    document.body.style.cursor = 'ns-resize'; // cursor style indicating a north-south resize
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
    document.addEventListener('mousemove', resizeSources);
    document.addEventListener('mouseup', stopResizingSources);
});

function resizeSources(e) {
    if (!isResizingSources) return;

    // Calculate the new height for checkbox-sources
    const containerRect = sourcesContainer.getBoundingClientRect();
    const newHeight = e.clientY - containerRect.top;

    const minHeight = 150; // Minimum height for sources
    const maxHeight = 1400; // Maximum height for sources

    if (newHeight >= minHeight && newHeight <= maxHeight) {
        sourcesContainer.style.height = `${newHeight}px`; // Resize sources container
        //signalsContainer.style.maxHeight = `calc(100vh - ${newHeight + 50}px)`; // Adjust signals container
        // Calculate and set the height for checkbox-signals to fill remaining space
        const remainingHeight = window.innerHeight - newHeight - resizeHandleSources.offsetHeight - 20; // Adjust for handle and margins
        signalsContainer.style.height = `${remainingHeight}px`; // Resize signals container
       
    }
}

function stopResizingSources() {
    isResizingSources = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = ''; // Re-enable text selection
    document.removeEventListener('mousemove', resizeSources);
    document.removeEventListener('mouseup', stopResizingSources);
}


/******************** Plot Button  ********************/

function updateButtonColor(buttonId, condition) {
    let button = document.getElementById(buttonId);

    if (button) {
        if (condition) {
            button.style.backgroundColor = "#9bf59ef3"; // Green (Hex)
            //button.style.color = "#FFFFFF"; // White text (Hex)
        } else {
            button.style.backgroundColor = "#fffffff3"; // white (Hex)
            //button.style.color = "#FFFFFF"; // White text (Hex)
        }
    } else {
        console.error(`Button with ID '${buttonId}' not found.`);
    }
}


/******************** Y Axis  ********************/

// Function to update all fields (Min or Max) for the same Y-axis
function updateAllFields(axis, fieldType, value) {
    document.querySelectorAll(`.${fieldType}-input`).forEach(input => {
        if (getSelectedYAxis(input) === axis) {
            input.value = value; // Ensure all fields for the same axis have the same value
        }
    });
}