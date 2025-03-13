// Global Storage for data sets ready to be plotted (traces)
const plotData = {
    // Trace is commonly used in Plotly's terminology for a single plotted dataset
    // Multiple data sets are called traces
    traces: [], // Traces is a group of Trace.

    activeSubplots: 
    {
        sp1: true,
        sp2: false,
        sp3: false,
        sp4: false,
        sp5: false,
    },

    // Clear all traces from the group
    clearTraces() {
        this.traces.length = 0; // Reset the array by setting its length to 0
    },
    
    // Add a data set (trace) to the group
    addData(trace) {
        // If the trace is an array, loop through each trace in the array
        const tracesToAdd = Array.isArray(trace) ? trace : [trace]; // Make sure it's always an array
    
        tracesToAdd.forEach(t => {
            if (t && t.name) {
                this.traces.push(t);
            } else {
                console.error("Invalid trace object. A 'name' property is required.", t);
            }
        });
    },

    // Scan traces and remove the data related to the signal name given
    removeData(signalName) {
        const initialLength = this.traces.length;
        this.traces = this.traces.filter(trace => trace.name !== signalName);
        const removedCount = initialLength - this.traces.length;

        if (removedCount > 0) {
            console.log(`Removed ${removedCount} trace(s) for signal '${signalName}'.`);
        } else {
            console.warn(`No traces found for signal '${signalName}' to remove.`);
        }
    },

    addYAxis() {
        if (this.yAxes.length < 3) {
            const newYAxis = `y${this.yAxes.length + 1}`;
            this.yAxes.push(newYAxis);
            console.log(`Added new Y-axis: ${newYAxis}`);
        } else {
            console.warn("Maximum of 3 Y-axes reached.");
        }
    },

    isYAxisInUse(axis) {
        // Check if any trace has the specified yaxis
        return plotData.traces.some(trace => trace.yaxis === axis);
    },

    // Get all traces in the plotData object
    getTraces() {
        return this.traces;
    }
};


const plotLayout = {
    responsive: true,
    hovermode: 'x',
    dragmode: 'pan',
    xaxis: { domain: [0.0, 1] },
    yaxis: 
    {  
        title: { text: '' }, 
        domain: [0, 1], 
        side: 'left', 
        visible: true, 
        showline: true
    },
    yaxis2: 
    { 
        title: { text: '' }, 
        domain: [0, 1], 
        range: [0, 100],
        overlaying: 'y', 
        side: 'left', 
        visible: false,
        showline: false, 
        position: 0
    },
    yaxis3: 
    { 
        title: { text: '' }, 
        domain: [0, 1], 
        range: [0, 100],
        overlaying: 'y', 
        side: 'right', 
        visible: false
    },
    yaxis20: 
    { 
        title: { text: 'Subplot A' }, 
        visible: false,
        showline: true, 
    },
    yaxis30: 
    { 
        title: { text: 'Subplot B' }, 
        visible: false,
        showline: true, 
    },
    yaxis40: 
    { 
        title: { text: 'Subplot C' }, 
        visible: false,
        showline: true, 
    },
    yaxis50: 
    { 
        title: { text: 'Subplot D' }, 
        visible: false,
        showline: true, 
    },
    grid: 
    {
        rows: 1,
        columns: 1,
        //subplots:[['xy'],['xy20'],['xy30'],['xy40'],['xy50']],
        roworder:'bottom to top'
    },
    annotations: [
        {
            text: 'Y1',
            x: 0,
            y: 1.02,  
            xref: 'paper',
            yref: 'paper',
            xanchor: 'right',
            yanchor: 'bottom',
            showarrow: false,
            visible: true,
            font: { size: 12, color: 'black' },
        },
        {
            text: 'Y2',
            x: 0.05,
            y: 1.02, 
            xref: 'paper',
            yref: 'paper',
            xanchor: 'right',
            yanchor: 'bottom',
            showarrow: false,
            visible: false,
            font: { size: 12, color: 'black' },
        },
        {
            text: 'Y3',
            x: 1,  // Align with y-axis3 tick labels on the right
            y: 1.02,  
            xref: 'paper',
            yref: 'paper',
            xanchor: 'left',
            yanchor: 'bottom',
            showarrow: false,
            visible: false,
            font: { size: 12, color: 'black' },
            align: 'center'
        }
    ]/*,
    legend: {
        x: 1,
        xanchor: 'right',
        y: 1
      }*/ 
};

const plotConfiguration = {
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d','lasso2d','resetScale2d'],
    displayModeBar: true,
}

function updateYAxisProperty(axisNumber, property, value) {
    // Normalize axisNumber to "", "2", or "3"
    if (typeof axisNumber === "number") {
        axisNumber = axisNumber === 1 ? "" : axisNumber.toString();
    } else if (typeof axisNumber === "string") {
        axisNumber = axisNumber.replace("yaxis", "").replace("y", "");
    }

    const axisKey = `yaxis${axisNumber}`;

    if (!plotLayout[axisKey]) {
        console.warn(`Y-axis ${axisKey} does not exist.`);
        return;
    }

    // Handle "range" property as an array instead of creating "range[0]" or "range[1]"
    if (property === "range") {
        if (!Array.isArray(plotLayout[axisKey].range)) {
            plotLayout[axisKey].range = [null, null]; // Initialize if not present
        }

        const minOrMaxIndex = value.index; // 0 for min, 1 for max
        plotLayout[axisKey].range[minOrMaxIndex] = value.value;
    } else {
        plotLayout[axisKey][property] = value;
    }
}

function updateXAxisProperty(property, value) {
    plotLayout.xaxis[property] = value;
}

// Example usage:
//updatePlotLayout('yaxis2:visible', true);   // Makes yaxis2 visible
//updatePlotLayout('annotations:2:visible', true);  // Makes annotation 2 visible
//updatePlotLayout('yaxis3:showline', true);   // Ensures yaxis3 line is shown
function updatePlotLayout(propertyPath, newValue) {
    const keys = propertyPath.split(':');
    let obj = plotLayout;

    // Traverse the object to find the correct property
    for (let i = 0; i < keys.length - 1; i++) {
        let key = keys[i];

        // Convert index keys (e.g., annotations:2) into integers for array access
        if (!isNaN(key)) {
            key = parseInt(key);
        }

        // Ensure the key exists
        if (!(key in obj)) {
            console.warn(`Invalid property path: ${propertyPath}`);
            return;
        }

        obj = obj[key]; // Move deeper in the structure
    }

    let finalKey = keys[keys.length - 1];

    // Convert to integer if targeting an array index
    if (!isNaN(finalKey)) {
        finalKey = parseInt(finalKey);
    }

    // Set the new value without overwriting the object
    if (obj.hasOwnProperty(finalKey)) {
        obj[finalKey] = newValue;
    } else {
        console.warn(`Invalid final property: ${finalKey} in ${propertyPath}`);
        return;
    }
}

/**
 * Generate a brand new plot on the given HTML container id "plot" 
 * @param {Object[]} data - An array of Plotly trace objects ready for plotting.
 */
function generatePlot() {
    // Check if there is an existing plot and clear it
    const plotElement = document.getElementById('plot');
    if (plotElement) {
        //Plotly.purge(plotElement); // Clear any existing plot
        Plotly.react(plotElement, [], {}, plotElement.layout);
    }
    console.log("plotLayout:", plotLayout);

    // Plot the data using Plotly
    if (plotData.traces.length > 0) {
        Plotly.newPlot('plot', plotData.traces, plotLayout, plotConfiguration);  
        // Show the configuration panel and populate it with the controls
        displayConfigurationControls(plotData.traces); 
    } else {
        console.error("No valid data for plotting.");
    }
}


function updatePlot() {
    const data = [];
    //const traces = Plotly.d3.select('#plot').node().data;
    const traces = document.querySelector('#plot').data;

    // Update each trace based on configuration
    traces.forEach((trace, index) => {
        const mode = document.querySelector(`.line-mode[data-index="${index}"]`).value;
        const width = document.querySelector(`.line-width[data-index="${index}"]`).value;
        const markerSize = document.querySelector(`.marker-size[data-index="${index}"]`).value;

        let color;
        // Check if the trace is a line or scatter (or another type) and retrieve its color accordingly
        if (trace.line) {
            color = trace.line.color;  // Color for line traces
        } else if (trace.marker) {
            color = trace.marker.color;  // Color for scatter traces
        }
        trace.type = "scattergl";
        trace.mode = mode;
        trace.line = { width: parseInt(width), color: color };
        trace.marker = { size: parseInt(markerSize), color: color };

        data.push(trace);
    });

    // Replot the graph with updated configuration
    Plotly.react('plot', data, plotLayout);

    updateAxisFieldsState()
}

/**
 * Generates a Plotly-ready dataset for a specific signal from appState.rawLog.
 */
function generatePlotlyDatasets(processedLogs) {
    // Initialize an array to store the plotly traces
    const traces = [];

    // Loop through each signal in the processed logs
    for (const signalName in processedLogs) {
        if (processedLogs.hasOwnProperty(signalName)) {
            const signalData = processedLogs[signalName];
            const signalArray = signalData.data;
            const unit = signalData.unit ? ` (${signalData.unit})` : ""; 

            // Extract data from the signal array
            const x = signalArray.map(entry => entry.timestamp); // Time (x-axis)
            const y = signalArray.map(entry => entry.value);     // Value (y-axis)

            if (x.length === 0 || y.length === 0) {
                console.warn(`No data found for signal "${signalName}".`);
                showToast(`Warning: No data found for "${signalName}" in the trace file.`);
                continue; // Skip to the next signal if no data is found
            }

            // Create a Plotly trace object for each signal
            const trace = {
                x: x,
                y: y,
                mode: "lines+markers",
                type: "scattergl",
                yaxis: 'y',
                name: `${signalName}${unit}`, // Updated name with unit
            };

            // Add the trace to the traces array
            traces.push(trace);
        }
    }

    // Return the array of traces
    return traces;
}

function showToast(message) {
    const toastContainer = document.getElementById("toast-container");

    // Create toast element
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;

    // Append toast to container
    toastContainer.appendChild(toast);

    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function resetSubplotLayout() {
    // Standard case: only "xy" is used, so 1 row x 1 column
    plotLayout.grid = {
        rows: 1,
        columns: 1,
        subplots: [["xy"]]
    };

    // Make sure yaxis object exists
    if (!plotLayout.yaxis) {
        plotLayout.yaxis = {};
    }
    // Set main Y-axis visible
    plotLayout.yaxis.visible = true;
    plotLayout.yaxis.domain = [0, 1];

    // Ensure the extra Y-axes exist, then mark them invisible
    const extraYAxes = ["yaxis20", "yaxis30", "yaxis40", "yaxis50"];
    extraYAxes.forEach(axisName => {
        if (!plotLayout[axisName]) {
            plotLayout[axisName] = {};
        }
        plotLayout[axisName].visible = false;
    });

    console.log("Layout reset to standard case:", plotLayout);
}

function updateActiveSubplotsStatus() {
    // Ensure plotData.activeSubplots exists
    if (!plotData.activeSubplots) {
        plotData.activeSubplots = {
            sp1: false,
            sp2: false,
            sp3: false,
            sp4: false,
            sp5: false,
        };
    }

    // Set all subplots to false without replacing the object reference
    Object.keys(plotData.activeSubplots).forEach(key => {
        plotData.activeSubplots[key] = false;
    });

    // Iterate through all subplot selectors and update active status
    document.querySelectorAll(".subplot-selector").forEach((dropdown) => {
        const selectedValue = dropdown.value; // e.g., "sp1", "sp2"
        
        if (plotData.activeSubplots.hasOwnProperty(selectedValue)) {
            plotData.activeSubplots[selectedValue] = true;
        }
    });

    console.log(plotData.activeSubplots); // Debugging output
}


function getSelectedSubplots() {
    const selections = {};

    document.querySelectorAll(".subplot-selector").forEach((dropdown) => {
        const index = dropdown.dataset.index; // Identify which trace it belongs to
        const selectedValue = dropdown.value; // e.g., "sp1", "sp2"
        selections[index] = selectedValue;
    });

    // 1) Gather all subplot values (e.g. ["sp2", "sp2", "sp3", "sp4"]).
    const values = Object.values(selections);

    // 2) Remove duplicates (Set).
    const unique = new Set(values); // e.g. { "sp2", "sp3", "sp4" }

    // 3) Convert to an array.
    const selectedSubplots = [...unique]; // e.g. ["sp2", "sp3", "sp4"]

    return selectedSubplots;
}

function updateSubplotLayout(selectedSubplots) {
    // Step 1: Extract unique subplots from values
    const activeSubplots = getSelectedSubplots(selectedSubplots);
    const activeCount = activeSubplots.length;

    //console.log("Active Subplots:", activeSubplots); 
    //console.log("Number of Active Subplots:", activeCount);

    // Step 2: Adjust your grid rows 
    plotLayout.grid.rows = activeCount || 1; // At least 1 row if all subplots are empty

    // Step 2a: Build subplots array based on active subplots
    //   sp1 => "xy"
    //   sp2 => "xy20"
    //   sp3 => "xy30"
    //   sp4 => "xy40"
    //   sp5 => "xy50"
    let subplotsArray = [];
    if (activeCount > 0) {
        activeSubplots.forEach(sp => {
            if (sp === "sp1") {
                subplotsArray.push(["xy"]);
            } else {
                // e.g. sp2 => "xy20"
                const num = sp.substring(2);
                subplotsArray.push([`xy${num}0`]);
            }
        });
    } else {
        // If no active subplots, default to the main plot
        subplotsArray = [["xy"]];
    }
    // Assign the constructed array to the layout
    plotLayout.grid.subplots = subplotsArray;

    // Step 3: Reset Y-axis visibility to false (or create them if missing)
    const yAxes = ["yaxis", "yaxis20", "yaxis30", "yaxis40", "yaxis50"];
    yAxes.forEach(axis => {
        if (!plotLayout[axis]) {
            plotLayout[axis] = {};
        }
        plotLayout[axis].visible = false;
    });

    // Step 4: Evenly divide domain
    const step = 1 / (activeCount || 1); 
    let position = 0;

    // Step 5: For each active subplot, set domain, show it
    activeSubplots.forEach(sp => {
        // sp1 => "yaxis"
        // sp2 => "yaxis20"
        // sp3 => "yaxis30"
        // etc.
        const axisKey = sp === "sp1" ? "yaxis" : `yaxis${sp.substring(2)}0`;

        plotLayout[axisKey].domain = [position, position + step - 0.02];
        plotLayout[axisKey].visible = true;
        position += step;
    });

    //console.log("Updated plotLayout:", plotLayout);
}

// If axis is in use by a trace, make it visible in the layout
function manageMainYaxis() {
    // If axis is in use by a trace, make it visible in the layout
    const yInUse  = plotData.isYAxisInUse("y");
    const y2InUse = plotData.isYAxisInUse("y2");
    const y3InUse = plotData.isYAxisInUse("y3");
    plotLayout["yaxis"].visible = yInUse;
    plotLayout.annotations[0].visible = yInUse;
    plotLayout["yaxis2"].visible = y2InUse;
    plotLayout.annotations[1].visible = y2InUse;
    plotLayout["yaxis3"].visible = y3InUse;
    plotLayout.annotations[2].visible = y3InUse;

    // If y and y2 are active, y shall make room for y2
    // adjust label placement accordingly
    if (yInUse && !y2InUse) {
        plotLayout.annotations[0].x = 0; //Y1 label
    } else if (!yInUse && y2InUse) {
        plotLayout.annotations[1].x = 0; //Y2 label
    }
    if (yInUse && y2InUse){
        plotLayout.xaxis.domain = [0.05, 1];
        plotLayout.annotations[0].x = 0.05;
        plotLayout.annotations[1].x = 0;
    } else {
        plotLayout.xaxis.domain = [0, 1];
    }
}