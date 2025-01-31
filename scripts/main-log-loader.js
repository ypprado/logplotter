

let log = null; // Global variable to store the JSON database

function resetLog() {
    // Clear the global database variable
    log = [];
}

function isLogLoaded() {
    if (!log) {
        console.error("Log is not loaded or is invalid.");
        return false;
    } else {
        console.log("Log loaded.");
        return true;
    }
}


function selectFileLOG() {
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.blf, .trc, .json';

        // Wait a little before triggering the click
        setTimeout(() => {
            fileInput.addEventListener('change', function (event) {

                // Get the selected file
                const file = event.target.files[0];
                if (file) {
                    resolve(file); // Resolve with the selected file
                } else {
                    reject("No file selected.");
                }
            });
            fileInput.click();
        }, 5);
    });
}

async function parseFileLOG(file) {
    try {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        let parsedData;

        switch (fileExtension) {
            case 'blf':
                parsedData = await parseBLF(file); // Directly handle BLF files
                break;
            case 'json':
                parsedData = await parseJSONlog(file); // Handle JSON files
                break;
            case 'trc':
                parsedData = await parseTRC(file); // Handle TRC files
                break;
            default:
                alert('Unsupported file format!');
                return;
        }
        return parsedData;

    } catch (error) {
        console.error("Error processing the log file:", error);
    }
}

/**
 * Converts parsed CAN messages into the unified log format.
 * @param {Array} parsedMessages - Array of parsed CAN messages from parseBLF.
 */
function buildUnifiedLog(parsedMessages) {
  
    resetLog();

    // Iterate over each parsed CAN message
    parsedMessages.forEach((msg) => {
        const unifiedMessage = {
            timestamp: msg.timestamp, // Timestamp in seconds
            id: `0x${msg.arbitrationId.toString(16).toUpperCase()}`, // Hexadecimal ID
            data: Array.from(msg.data), // Convert Uint8Array to a standard array
            channel: msg.channel || null, // CAN channel (null if not provided)
            isExtendedId: msg.isExtendedId, // Extended ID flag
            isRemoteFrame: msg.isRemoteFrame, // Remote frame flag
            isRx: msg.isRx // Rx flag
        };

        // Add the unified message to the log
        log.push(unifiedMessage);
    });
}

/*
{
    "log": [
      {
        "timestamp": 123456789.123,  // Timestamp in seconds
        "id": "0x100",             // CAN message ID in hexadecimal
        "data": [255, 0, 34, 12],  // Raw CAN payload
        "channel": 1,              // CAN channel (if provided)
        "isExtendedId": false,     // Whether the ID is extended
        "isRemoteFrame": false,    // Whether it's a remote frame
        "isRx": true               // Whether it is a received message
      }
    ]
  }
*/
//////////////// OLD CODE TGO DELETE

/**
 * Handles the selection of a log file, processes its content, updates the global state,  
 * enables the "Generate Plot" button, and marks the log as loaded.  
 * Logs errors if file reading fails or no file is selected.
 
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
}*/

/**
 * Processes the content of a log file, parses the time, signal, and value, 
 * and stores the parsed data in appState.rawLog.
 
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
}*/
