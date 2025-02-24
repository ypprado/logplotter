const databaseHandler = {
    database: null, // Store database internally
    dropdownContent: {
        ID: [],
        MsgName: [],
        Sender: [],
        Signal: [],
    },

    resetDatabase() {
        this.database = null;
        this.dropdownContent = { ID: [], MsgName: [], Sender: [], Signal: [] };
    },

    isDatabaseLoaded() {
        return this.database?.messages ? true : false;
    },

    async loadDatabase() {
        try {
            //const file = await fileHandler.selectFile();
            const file = await this.selectFileDB();
            //const parsedData = await fileHandler.parseFile(file);
            const parsedData = await this.parseFileDB(file);
            this.database = this.buildUnifiedDatabase(parsedData);
            this.extractDropdownContent();
            return this.database;
        } catch (error) {
            console.error(error);
            throw new Error('Error loading database file.');
        }
    },

    getDatabase() {
        return this.database;
    },

    getDropdownContent() {
        return this.dropdownContent;
    },

    extractDropdownContent() {
        if (!this.isDatabaseLoaded()) return;

        this.database.messages.forEach((message) => {
            this.addUnique(this.dropdownContent.ID, message.id);
            this.addUnique(this.dropdownContent.MsgName, message.name);
            this.addUnique(this.dropdownContent.Sender, message.sender);
            message.signals.forEach((signal) => {
                this.addUnique(this.dropdownContent.Signal, signal.name);
            });
        });
    },

    addUnique(array, value) {
        if (!array.includes(value)) {
            array.push(value);
        }
    },

    buildUnifiedDatabase(parsedData) {
        return {
            network: {
                protocol: "CAN",
                baudRate: 250000,
                messageCount: parsedData.messages.length,
            },
            messages: parsedData.messages.map((msg) => ({
                id: msg.id,
                name: msg.name,
                dlc: msg.dlc,
                cycleTime: 0,
                sender: msg.sender,
                signals: msg.signals.map((sig) => ({
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
                    ...(sig.valueDescriptions && { valueDescriptions: sig.valueDescriptions }),
                    ...(sig.isMultiplexer && { isMultiplexer: true }),
                    ...(sig.multiplexerValue !== undefined && { multiplexerValue: sig.multiplexerValue }),
                })),
            })),
            nodes: parsedData.nodes.map((node) => ({
                name: node,
                transmitMessages: parsedData.messages.filter((msg) => msg.sender === node).map((msg) => msg.name),
                receiveMessages: parsedData.messages.filter((msg) => msg.sender !== node).map((msg) => msg.name),
            })),
        };
    },

    selectFileDB() {
        return new Promise((resolve, reject) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.dbc, .sym';

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
    },

    async parseFileDB(file) {
        const fileExtension = file.name.split('.').pop();
    
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
    
            reader.onload = function (event) {
                const fileContent = event.target.result;
    
                try {
                    switch (fileExtension) {
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
    },
};
export default databaseHandler;


/*****************************
let database = null; // Global variable to store the database

// Lists that will populate the checkboxes
const dropdownContent ={
    ID: [],
    MsgName: [],
    Sender: [],
    Signal: [],
}

// Clear dropdown content
function resetDatabase() {
    database = null;
    dropdownContent.ID = [];
    dropdownContent.MsgName = [];
    dropdownContent.Sender = [];
    dropdownContent.Signal = [];
}

// Check if database is not loaded or is invalid.
function isDatabaseLoaded() {
    if (!database || !database.messages) {
        return false;
    } else {
        return true;
    }
}

function selectFileDB() {
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.dbc, .sym';

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
}


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

const databaseHandler = {
    loadDatabase: async function () {
        try {
            const file = await selectFileDB();
            const parsedData = await parseFileDB(file);
            database = buildUnifiedDatabase(parsedData);
            //if (database) extractDropdownContent();
            return database;
        } catch (error) {
            console.error(error);
            alert('Error loading database file.');
        }
    },

    getDatabase: function () {
        return database;
    },

    getDropdownContent: function () {
        return dropdownContent;
    },

    isDatabaseLoaded: isDatabaseLoaded,
    resetDatabase: resetDatabase,
    extractDropdownContent: extractDropdownContent,
}
export default databaseHandler;

*/

function sum(a, b) {
    return a + b;
  }
//  module.exports = sum;
export { sum };