/**
 * This file contains information that shall be used across the application
 */

// Iindexes are linked to columns in the database as follows. Used in database-handler.js
const Index = {
    ECU: 0,
    NODE: 1,
    ID: 2,
    SIGNAL: 3,
};

// Global state to store the extracted data
const appState = {
    // Lists that will populate the checkboxes
    ECUs: [],
    IDs: [],
    Nodes: [],
    // Global status for loaded files
    isDatabaseLoaded: false,
    isLogLoaded: false,
    // Global containers for parsed database and log
    parsedCSV: [],
    rawLog: [],
    // Data manipulation 
    loadCSV(content) {
        this.parsedCSV = this.parseCSV(content);
    },
    parseCSV(content) {
        // Split the content into rows and parse each row into columns
        return content
            .trim() // Remove unnecessary leading/trailing whitespace
            .split("\n") // Split into rows
            .map(row => row.split(",").map(value => value.trim())); // Parse columns
    },
};

/**
 * Sample of a trace
 *      x: [ 1, 2, 3],
        y: [24,24,26],
        mode: "lines+markers",
        type: "scatter",
        name: signalName, // Use the signal name as the trace label
 */

// Global Storage for data sets ready to be plotted (traces)
const plotData = {
    // Trace is commonly used in Plotly's terminology for a single plotted dataset
    // Multiple data sets are called traces
    traces: [], // Traces is a group of Trace.

    // Clear all traces from the group
    clearTraces() {
        this.traces.length = 0; // Reset the array by setting its length to 0
    },
    
    // Add a data set (trace) to the group
    addData(trace) {
        if (trace && trace.name) { // Ensure the trace has a name
            this.traces.push(trace);
            console.log(`Trace for signal '${trace.name}' added to global traces.`);
        } else {
            console.error("Invalid trace object. A 'name' property is required.");
        }
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
    }
};


