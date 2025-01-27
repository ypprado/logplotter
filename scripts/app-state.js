/**
 * This file contains information that shall be used across the application
 */


let database = null; // Global variable to store the JSON database

const dropdownContent ={
    // Lists that will populate the checkboxes
    ID: [],
    MsgName: [],
    Sender: [],
    Signal: [],
}


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


