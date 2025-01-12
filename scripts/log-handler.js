/**
 * Handles the selection of a log file, processes its content, updates the global state,  
 * enables the "Generate Plot" button, and marks the log as loaded.  
 * Logs errors if file reading fails or no file is selected.
 */
function handleFileSelectLog(event) {

    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        handleLogFile(fileContent);
        //TODO ADD CHECKS FOR PLAUSABILITY
        appState.isLogLoaded = true; // Mark the log as loaded
        document.getElementById("PlotButton").disabled = false;
    };

    reader.onerror = function () {
        console.error("Error reading file:", reader.error);
    };

    reader.readAsText(file); // Read file as text. todo: WHY?
}

/**
 * Processes the content of a log file, parses the time, signal, and value, 
 * and stores the parsed data in appState.rawLog.
 */
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
    //console.log("Log processed successfully:", appState.rawLog);
}
