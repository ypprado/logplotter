/**
 * Generate a brand new plot on the given HTML container id "plot" 
 * @param {Object[]} data - An array of Plotly trace objects ready for plotting.
 */
function generatePlot(data, layout) {
    // Plot the data using Plotly
    if (data.length > 0) {
        Plotly.newPlot('plot', data, layout);  
        // Show the configuration panel and populate it with the controls
        displayConfigurationControls(data); 
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

            <label>Type</label>
            <select class="line-type" data-index="${index}">
                <option value="scatter" ${trace.type === 'scatter' ? 'selected' : ''}>Scatter</option>
                <option value="bar" ${trace.type === 'bar' ? 'selected' : ''}>Bar</option>
            </select>

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