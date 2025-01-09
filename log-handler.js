

function handleFileSelectLog(event) {
    console.log("Log selected:", event);

    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        console.log("Log loaded.");
        processCSVAndPlot(fileContent);
    };

    reader.onerror = function () {
        console.error("Error reading file:", reader.error);
    };

    reader.readAsText(file); // Read file as text. todo: WHY?
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