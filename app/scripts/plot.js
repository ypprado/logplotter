// Global Storage for data sets ready to be plotted (traces)
const plotData = {
    // Trace is commonly used in Plotly's terminology for a single plotted dataset
    // Multiple data sets are called traces
    traces: [], // Traces is a group of Trace.
    //yAxes: ["y"], // List of available Y-axes (initially only "y")

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

    isAxisInUse(axis) {
        // Check if any trace has the specified yaxis
        return plotData.traces.some(trace => trace.yaxis === axis);
    }
};


const plotLayout = {
    responsive: true,
    grid: { rows: 1, columns: 1 },
    xaxis: { domain: [0.0, 1] },
    yaxis: {  title: { text: '' }, domain: [0, 1], side: 'left', visible: true},
    yaxis2: { title: { text: '' }, domain: [0, 1], overlaying: 'y', side: 'left', visible: false, position: 0},
    yaxis3: { title: { text: '' }, domain: [0, 1], overlaying: 'y', side: 'right', visible: false},
};

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
        Plotly.newPlot('plot', plotData.traces, plotLayout);  
        // Show the configuration panel and populate it with the controls
        displayConfigurationControls(plotData.traces); 
    } else {
        console.error("No valid data for plotting.");
    }
}

function updatePlot() {
    const data = [];
    const traces = Plotly.d3.select('#plot').node().data;

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
            const signalArray = processedLogs[signalName];

            // Extract data from the signal array
            const x = signalArray.map(entry => entry.timestamp); // Time (x-axis)
            const y = signalArray.map(entry => entry.value);     // Value (y-axis)

            if (x.length === 0 || y.length === 0) {
                console.warn(`No data found for signal "${signalName}".`);
                continue; // Skip to the next signal if no data is found
            }

            // Create a Plotly trace object for each signal
            const trace = {
                x: x,
                y: y,
                mode: "lines+markers",
                type: "scattergl",
                yaxis: 'y',
                name: signalName, // Directly use the signalName here
            };

            // Add the trace to the traces array
            traces.push(trace);
        }
    }

    // Return the array of traces
    return traces;
}



/*function moveTraceToYAxis(traceName, newYAxis) {
    const trace = plotData.traces.find(t => t.name === traceName);
    if (trace && plotData.yAxes.includes(newYAxis)) {
        trace.yaxis = newYAxis;
        console.log(`Moved '${traceName}' to Y-axis '${newYAxis}'.`);
        updatePlot();
    } else {
        console.warn(`Invalid trace or Y-axis '${newYAxis}' does not exist.`);
    }
}*/



/* 

const trace = {
    mode: "lines+markers",
    name: "Dummy-Signal",
    type: "scatter",
    yaxis: 'y2',
    x: ["2025-01-28T15:07:54.275Z", "2025-01-28T15:07:54.375Z"],
    x: [20,20]
};

example for two subplots
var trace1 = {
  x: [1, 2, 3, 4, 5],
  y: [10, 15, 13, 17, 12],
  type: 'scatter',
  xaxis: 'x1',
  yaxis: 'y1'
};

var trace2 = {
  x: [1, 2, 3, 4, 5],
  y: [16, 5, 11, 9, 20],
  type: 'scatter',
  xaxis: 'x2',
  yaxis: 'y2'
};

var data = [trace1, trace2];

var layout = {
  grid: {rows: 1, columns: 2, pattern: 'independent'},
  xaxis: {title: 'X Axis 1', domain: [0, 0.5]},
  yaxis: {title: 'Y Axis 1'},
  xaxis2: {title: 'X Axis 2', domain: [0.5, 1]},
  yaxis2: {title: 'Y Axis 2'}
};

Plotly.newPlot('myDiv', data, layout);
*/