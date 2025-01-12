/**
 * Generate a brand new plot on the given HTML container id "plot" 
 * @param {Object[]} data - An array of Plotly trace objects ready for plotting.
 */
function generatePlot() {
    // Layout settings
    const layout = createLayoutSettings();

    // Check if there is an existing plot and clear it
    const plotElement = document.getElementById('plot');
    if (plotElement) {
        Plotly.purge(plotElement); // Clear any existing plot
    }

    // Plot the data using Plotly
    if (plotData.traces.length > 0) {
        Plotly.newPlot('plot', plotData.traces, layout);  
        // Show the configuration panel and populate it with the controls
        displayConfigurationControls(plotData.traces); 
    } else {
        console.error("No valid data for plotting.");
    }
}


function displayConfigurationControls(data) {
    // Clear previous configurations
    const configContainer = document.getElementById('lineConfigurations');
    configContainer.innerHTML = '';

    // Loop through the lines (traces) and generate the controls
    data.forEach((trace, index) => {
        const lineConfig = document.createElement('div');
        lineConfig.classList.add('line-config');

        // Set default line width if not available
        const lineWidth = trace.line && trace.line.width ? trace.line.width : 2;

        lineConfig.innerHTML = `
            <label>Line ${index + 1} Configuration</label>

            <label>Mode</label>
            <select class="line-mode" data-index="${index}">
                <option value="lines" ${trace.mode === 'lines' ? 'selected' : ''}>Lines</option>
                <option value="markers" ${trace.mode === 'markers' ? 'selected' : ''}>Markers</option>
                <option value="lines+markers" ${trace.mode === 'lines+markers' ? 'selected' : ''}>Lines + Markers</option>
            </select>

            <label>Line Width</label>
            <input type="range" class="line-width" data-index="${index}" min="1" max="10" value="${lineWidth}" />
            <span class="line-width-value">${lineWidth}</span>
        `;

        // Add the line configuration to the container
        configContainer.appendChild(lineConfig);
    });

    // Add event listeners to update the plot based on configuration changes
    addConfigListeners();
}

function updatePlot() {
    const data = [];
    const traces = Plotly.d3.select('#plot').node().data;

    // Update each trace based on configuration
    traces.forEach((trace, index) => {
        const type = document.querySelector(`.line-type[data-index="${index}"]`).value;
        const mode = document.querySelector(`.line-mode[data-index="${index}"]`).value;
        const width = document.querySelector(`.line-width[data-index="${index}"]`).value;

        trace.type = type;
        trace.mode = mode;
        trace.line = { width: parseInt(width) };

        data.push(trace);
    });

    // Replot the graph with updated configuration
    Plotly.react('plot', data);
}

function createLayoutSettings() {

    const layout = {
        //title: 'Multiple Lines Plot',
        //xaxis: { title: 'X Axis' },
        responsive: true, // Enables automatic resizing
        yaxis: {
            title: {
                text: '', // Y-axis title text
                standoff: 0,   // No extra spacing from the axis
                font: {
                    size: 14,  // Customize font size if needed
                    color: 'black' // Customize font color if needed
                },
                x: -0.1,       // Horizontal positioning (adjust as needed)
                xanchor: 'center',
                yanchor: 'bottom'
            }
        },
        annotations: [
            {
                x: 0, // Align with the vertical Y-axis line
                y: 1, // Place it at the top of the Y-axis range
                xref: 'paper', // Reference the graph's x-axis in percentage (0 to 1)
                yref: 'paper', // Reference the graph's y-axis in percentage (0 to 1)
                text: 'Unit', // Y-axis title text
                showarrow: false, // No arrow needed
                font: {
                    size: 14, // Font size
                    color: 'black' // Font color
                },
                xanchor: 'center', // Center the text horizontally
                yanchor: 'bottom'  // Align text at its bottom edge
            }
        ]
    };

    return layout;
}

/**
 * Generates a Plotly-ready dataset for a specific signal from appState.rawLog.
 * 
 * @param {string} signalName - The name of the signal to generate the dataset for.
 * @returns {Object} - A Plotly trace object for the given signal.
 */
function generatePlotlyDataset(signalName) {
    if (!appState || !appState.rawLog) {
        console.error("No raw log data found in appState.");
        return null;
    }

    // Extract data for the specified signal
    const x = []; // Time (x-axis)
    const y = []; // Value (y-axis)

    appState.rawLog.forEach(entry => {
        if (entry.signal === signalName) {
            x.push(entry.time);  // Push the time value
            y.push(entry.value); // Push the signal value
        }
    });

    if (x.length === 0 || y.length === 0) {
        console.warn(`No data found for signal: ${signalName}`);
        return null;
    }

    // Create and return the Plotly trace object
    return {
        x: x,
        y: y,
        mode: "lines+markers",
        type: "scatter",
        name: signalName, // Use the signal name as the trace label
    };
}

/* example for two subplots
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