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
            const file = await this.selectFileDB();
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
            /*network: {
                protocol: "CAN",
                baudRate: 250000,
                messageCount: parsedData.messages.length,
            },*/
            messages: parsedData.messages.map((msg) => ({
                id: msg.id,
                name: msg.name,
                dlc: msg.dlc,
                //cycleTime: 0,
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
                            warning('File format not supported!');
                            break;
                    }
                } catch (error) {
                    reject(error); // Reject if parsing throws an error
                }
            };
    
            reader.onerror = function () {
                reject(new Error("Error reading file.")); // Reject on file read error
                warning('File format not supported!');
            };
    
            reader.readAsText(file); // Start reading the file as text
        });
    },
};
export default databaseHandler;

function sum(a, b) {
    return a + b;
  }
//  module.exports = sum;
export { sum };