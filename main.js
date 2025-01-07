/*async function uploadFile() {
    //const fileInput = document.getElementById('fileInput');
    //const formData = new FormData();
    //formData.append('file', fileInput.files[0]);

    // Example data for the plot
    const xData1 = [0, 1, 1.5, 2, 3, 4];
    const yData1 = [0, 1, 0.8, 0, 1, 0];  // Data for the first line
    const xData2 = [1, 2, 3, 4];
    const yData2 = [2, 3, 2, 3];   // Data for the second line
    const xData3 = [0, 2, 3, 4];
    const yData3 = [2.9, 2.8, 2.5, 1.1];  // Data for the third line

    // Plotting the graph
    const trace1 = {
        x: xData1,
        y: yData1,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Line 1'
    };
    const trace2 = {
        x: xData2,
        y: yData2,
        type: 'scatter',
        mode: 'lines',
        name: 'Line 2'
    };
    const trace3 = {
        x: xData3,
        y: yData3,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Line 3'
    };
    // Combine all traces
    const data = [trace1, trace2, trace3];
    // Layout settings
    const layout = {
        title: 'Multiple Lines Plot',
        xaxis: { title: 'X Axis' },
        yaxis: { title: 'Y Axis' }
    };

    // Plot the graph with all three lines
    Plotly.newPlot('plot', data, layout);    
}*/


// Trigger file input click
function loadDatabase() {
    console.log("1 Button Load Database clicked");  // Debugging log
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';

    // Wait a little before triggering the click
    setTimeout(() => {
        fileInput.addEventListener('change', function(event) {
            console.log("2 File selected (event listener triggered)");
            handleFileSelect(event);
        });
        fileInput.click();
    }, 5);
}

function handleFileSelect(event) {
    console.log("3 File selected:", event);

    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        console.log("4 Data loaded.");
        processCSVAndPlot(fileContent);
    };

    reader.onerror = function () {
        console.error("Error reading file:", reader.error);
    };

    reader.readAsText(file); // Read file as text
    console.log("End!");
}

function processCSVAndPlot(fileContent) {
    const data = processCSV(fileContent);

    // Layout settings
    const layout = createLayoutSettings();

    console.log("7 Data To be Plotted.");

    // Plot the data using Plotly
    generatePlot(data, layout);  

}

/**
 * Processes a CSV file, extracts datasets, and creates Plotly trace objects.
 * 
 * @param {string} csvContent - The raw content of the CSV file.
 * @returns {Object[]} - An array of Plotly trace objects ready for plotting.
 */
function processCSV(csvContent) {
    console.log("5 Data to be Processed.");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(","); // Extract column headers

    // Extract datasets
    const datasets = [];
    for (let i = 1; i < headers.length; i++) {
        datasets.push({ x: [], y: [] });
    }

    // Populate datasets
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length !== headers.length) continue; // Skip invalid lines

        const xValue = parseFloat(values[0]);
        if (isNaN(xValue)) continue; // Skip invalid x-values

        datasets.forEach((dataset, index) => {
            const yValue = parseFloat(values[index + 1]);
            if (!isNaN(yValue)) {
                dataset.x.push(xValue);
                dataset.y.push(yValue);
            }
        });
    }

    // Create traces and combine them into a single array
    const data = [];
    datasets.forEach((dataset, index) => {
        const trace = createTrace(
            dataset,
            "scatter",
            "lines+markers",
            `Line ${index + 1}`
        );
        if (trace) {
            data.push(trace);
        }
    });

    console.log("6 Data Processed.");
    return data;
}

/**
 * Creates a Plotly trace object from the given dataset.
 * 
 * @param {Object} dataset - The dataset containing x and y arrays.
 * @param {number[]} dataset.x - The X-axis data points.
 * @param {number[]} dataset.y - The Y-axis data points.
 * @param {string} type - The type of plot (e.g., 'scatter').
 * @param {string} mode - The mode of the plot (e.g., 'lines', 'lines+markers').
 * @param {string} name - The name/label of the trace (e.g., 'Line 1').
 * @returns {Object|null} - A trace object for Plotly if valid, otherwise null.
 */
function createTrace(dataset, type, mode, name) {
    // Check if dataset has the required x and y properties
    if (!dataset || !Array.isArray(dataset.x) || !Array.isArray(dataset.y)) {
        console.error("Invalid dataset: Must contain x and y as arrays.");
        return null;
    }

    // Check if x and y arrays have the same length
    if (dataset.x.length !== dataset.y.length) {
        console.error("Invalid dataset: x and y arrays must have the same length.");
        return null;
    }

    // Create and return the trace object
    return {
        x: dataset.x,
        y: dataset.y,
        type: type,
        mode: mode,
        name: name
    };
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

function addConfigListeners() {
    // Add listener for type selection
    const typeSelectors = document.querySelectorAll('.line-type');
    typeSelectors.forEach(selector => {
        selector.addEventListener('change', updatePlot);
    });

    // Add listener for mode selection
    const modeSelectors = document.querySelectorAll('.line-mode');
    modeSelectors.forEach(selector => {
        selector.addEventListener('change', updatePlot);
    });

    // Add listener for line width change
    const widthSliders = document.querySelectorAll('.line-width');
    widthSliders.forEach(slider => {
        slider.addEventListener('input', function (event) {
            const lineWidthValue = event.target.value;
            event.target.nextElementSibling.textContent = lineWidthValue;
            updatePlot();
        });
    });
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

function loadLog() {
    //alert('Load Log button clicked');
    const checkboxGroup = document.querySelector(`#checkbox-signals .checkbox-group`);
    checkboxGroup.innerHTML = ` 
    <label><input type="checkbox" id="cb-log-1"> Log Option 1</label> 
    <label><input type="checkbox" id="cb-log-2"> Log Option 2</label> 
    <label><input type="checkbox" id="cb-log-3"> Log Option 3</label> 
    <label><input type="checkbox" id="cb1-1"> Option 1</label>
    `;
}

function populateCheckboxGroup(option) {
    const checkboxGroup = document.querySelector('#checkbox-sources .checkbox-group');
    
    if (!checkboxGroup) {
        console.error('Checkbox group not found!');
        return;
    }

    // Clear the existing checkboxes
    checkboxGroup.innerHTML = '';

    // Populate checkboxes based on the selected option
    if (option === 'noFilter') {
        checkboxGroup.innerHTML = `<p>No filter applied.</p>`;
    } else if (option === 'filterById') {
        checkboxGroup.innerHTML = `
            <label><input type="checkbox" id="cb-id-1"> ID 0x001</label>
            <label><input type="checkbox" id="cb-id-2"> ID 0x002</label>
            <label><input type="checkbox" id="cb-id-3"> ID 0x003</label>
        `;
    } else if (option === 'filterByNode') {
        checkboxGroup.innerHTML = `
            <label><input type="checkbox" id="cb-node-1"> ECU 1</label>
            <label><input type="checkbox" id="cb-node-2"> ECU 2</label>
            <label><input type="checkbox" id="cb-node-3"> ECU 3</label>
        `;
    }
}

// Event listener for the dropdown selection change
document.getElementById('filterOptions').addEventListener('change', function() {
    populateCheckboxGroup(this.value);
});

// Right Sidebar Show/Hide
document.getElementById('showConfigBtn').addEventListener('click', function() {
    const rightSidebar = document.getElementById('rightSidebar');
    const currentRightPosition = rightSidebar.style.right;

    // Toggle sidebar visibility by adjusting the right property
    if (currentRightPosition === '0px') {
        rightSidebar.style.right = '-400px'; // Hide the sidebar
    } else {
        rightSidebar.style.right = '0'; // Show the sidebar
    }
});

/* first example of plotting fixed data
function plotData(data) {
        // Simulating an uploaded file and plotting
        const simulatedData = {
            x: [1, 2, 3, 4],
            y: [10, 20, 30, 40]
        };
        //plotData(simulatedData);
    const trace = {
        x: data.x,
        y: data.y,
        type: 'scatter'
    };
    const layout = {
        //title: 'Uploaded Data Plot',
        xaxis: {
            title: 'X Axis'
        },
        yaxis: {
            title: 'Y Axis'
        }
    };

    Plotly.newPlot('plot', [trace], layout);
}*/