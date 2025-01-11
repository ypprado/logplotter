

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
        //TODO ADD CHECKS FOR PLAUSABILITY
        appState.isLogLoaded = true; // Mark the log as loaded
        document.getElementById("PlotButton").disabled = false;
    };

    reader.onerror = function () {
        console.error("Error reading file:", reader.error);
    };

    reader.readAsText(file); // Read file as text. todo: WHY?
    console.log("End!");
}

function processCSVAndPlot(fileContent) {
    
    handleLogFile(fileContent);
    
    //plotData.addData(generatePlotlyDataset("HV_DC"));
    //console.log("plotData: ", plotData.traces);
 
}

// Extract data from CSV and store in appState
function handleLogFile(fileContent) {
    const logData = [];

    // Split the content into lines
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
        // Skip the header
        if (index === 0) return;

        const parts = line.split(',');
        if (parts.length >= 4) {
            const time = parseFloat(parts[0]); // Time in ms
            const signal = parts[2].trim();   // Signal name
            const value = parseFloat(parts[3]); // Signal value

            // Push the parsed data into the logData array
            logData.push({ time, signal, value });
        }
    });

    // Store the parsed data in appState.rawLog
    appState.rawLog = logData;
    console.log("Log processed successfully:", appState.rawLog);
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