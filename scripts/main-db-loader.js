let database = null; // Global variable to store the JSON database

const dropdownContent ={
    // Lists that will populate the checkboxes
    ID: [],
    MsgName: [],
    Sender: [],
    Signal: [],
}

function resetDatabase() {
    // Clear the global database variable
    database = null;

    // Clear the dropdownContent object
    dropdownContent.ID = [];
    dropdownContent.MsgName = [];
    dropdownContent.Sender = [];
    dropdownContent.Signal = [];
}

function isDatabaseLoaded() {
    if (!database || !database.messages) {
        console.error("Database is not loaded or is invalid.");
        return false;
    } else {
        console.log("Database loaded.");
        return true;
    }
}

function selectFileDB() {
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.dbc, .sym, .json';

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

async function parseFileDB(file) {
    const fileExtension = file.name.split('.').pop();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            const fileContent = event.target.result;

            try {
                switch (fileExtension) {
                    case 'json':
                        resolve(parseJSON(fileContent)); // Resolve with parsed JSON
                        break;
                    case 'dbc':
                        resolve(parseDBC(fileContent)); // Resolve with parsed DBC
                        break;
                    case 'sym':
                        resolve(parseSYM(fileContent)); // Resolve with parsed SYM
                        break;
                    default:
                        reject(new Error('Unsupported file format.'));
                        alert('File format not supported!');
                }
            } catch (error) {
                reject(error); // Reject if parsing throws an error
            }
        };

        reader.onerror = function () {
            reject(new Error("Error reading file.")); // Reject on file read error
            alert('File format not supported!');
        };

        reader.readAsText(file); // Start reading the file as text
    });
}

function extractDropdownContent() {
    database.messages.forEach((message) => {

        // Add unique message ID
        if (!dropdownContent.ID.includes(message.id)) {
            dropdownContent.ID.push(message.id);
        }

        // Add unique message name
        if (!dropdownContent.MsgName.includes(message.name)) {
            dropdownContent.MsgName.push(message.name);
        }

        // Add unique sender
        if (!dropdownContent.Sender.includes(message.sender)) {
            dropdownContent.Sender.push(message.sender);
        }

        // Add unique signals
        message.signals.forEach((signal) => {
            if (!dropdownContent.Signal.includes(signal.name)) {
                dropdownContent.Signal.push(signal.name);
            }
        });
    });

    //console.log('IDs:',dropdownContent.ID);
    //console.log('MsgName:',dropdownContent.MsgName);
    //console.log('Sender:',dropdownContent.Sender);
    //console.log('Signal:',dropdownContent.Signal);
}

/**
 * Converts parsed DBC data into the unified JSON format.
 * 
 * @param {Object} parsedData - The parsed DBC data.
 * @returns {Object} - The unified JSON format database.
 */
function buildUnifiedDatabase(parsedData) {
    const { messages, nodes } = parsedData;

    // Build the messages array
    const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        name: msg.name,
        dlc: msg.dlc,
        cycleTime: 0, // Cycle time not included in the DBC file
        sender: msg.sender,
        signals: msg.signals.map((sig) => {
            const formattedSignal = {
                name: sig.name,
                startBit: sig.startBit,
                length: sig.length,
                byteOrder: sig.byteOrder,
                valueType: sig.valueType,
                scaling: sig.scaling,
                offset: sig.offset,
                units: sig.units,
                valueRange: sig.valueRange,
                defaultValue: sig.defaultValue,
            };

            // Include valueDescriptions if they exist
            if (sig.valueDescriptions) {
                formattedSignal.valueDescriptions = sig.valueDescriptions;
            }

            // Include multiplexer fields if they exist
            if (sig.isMultiplexer) {
                formattedSignal.isMultiplexer = true;
            }
            if (sig.multiplexerValue !== undefined) {
                formattedSignal.multiplexerValue = sig.multiplexerValue;
            }

            return formattedSignal;
        }),
    }));

    // Build the nodes array
    const formattedNodes = nodes.map((node) => ({
        name: node,
        transmitMessages: messages
            .filter((msg) => msg.sender === node)
            .map((msg) => msg.name),
        receiveMessages: messages
            .filter((msg) => msg.sender !== node)
            .map((msg) => msg.name),
    }));

    return {
        network: {
            protocol: "CAN",
            baudRate: 250000, // Default baud rate; adjust as needed
            messageCount: messages.length,
        },
        messages: formattedMessages,
        nodes: formattedNodes,
    };
}
