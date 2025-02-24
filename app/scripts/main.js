import databaseHandler from "./main-db-loader.js";
/******************** Permanent Sidebar ********************/
/**
 * Monitor "arrowButton" which is responsible for hide/unhide 
 * the sidepanel.
 * Consequently, the plot are (container) must be resized and
 * the plot updated
 */
document.addEventListener('DOMContentLoaded', function () {
    const arrowButton = document.getElementById('arrowButton');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');

    function toggleSidebar() {

        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            arrowButton.textContent = '→';
            arrowButton.title = 'Expand Sidebar';
            content.style.width = `100%`; // Adjust content width dynamically
        } else {
            arrowButton.textContent = '←';
            arrowButton.title = 'Collapse Sidebar';
            const sidebarWidth = sidebar.getBoundingClientRect().width; // Get current sidebar width
            content.style.width = `calc(100% - ${sidebarWidth}px)`; // Adjust content width dynamically
        }

        Plotly.Plots.resize('plot');
    }

    arrowButton.addEventListener('click', toggleSidebar);

    window.addEventListener('resize', () => {
        Plotly.Plots.resize('plot');
    });
});

/******************** Button Database ********************/
// On button click: Load Database
document.addEventListener("DOMContentLoaded", () => {
    const loadDatabaseBtn = document.getElementById("loadDatabaseButton");

    if (loadDatabaseBtn) {
        loadDatabaseBtn.addEventListener("click", async () => {
            try {
                // Step 1: Load the database (file selection + parsing + transformation)
                databaseHandler.resetDatabase(); // Ensure previous data is cleared
                await databaseHandler.loadDatabase();

                // Step 2: Check if the database is loaded successfully
                if (databaseHandler.isDatabaseLoaded()) {
                    console.log("Database loaded:", databaseHandler.getDatabase());
                    databaseHandler.extractDropdownContent(); // Update dropdowns
                    populateSignals(); // Update UI elements
                    updateButtonColor('loadDatabaseButton', true);

                    // Step 3: Enable the "Generate Plot" button if the log is also loaded
                    if (isLogLoaded()) {
                        document.getElementById("PlotButton").disabled = false;
                    }
                } else {
                    updateButtonColor('loadDatabaseButton', false);
                }
            } catch (error) {
                console.error("Error during database loading process:", error);
            }
        });
    }
});

async function loadDatabaseButton1() {
/*    try {
        // Step 1: Let the user select a file
        const file = await selectFileDB();
        // Step 2: Parse the file content
        const parsedData = await parseFileDB(file);
        // Step 3: Load the global database in unified JSON format
        resetDatabase();
        database = buildUnifiedDatabase(parsedData);

        if(isDatabaseLoaded()){
            extractDropdownContent(); 
            populateSignals();
            updateButtonColor('loadDatabaseButton',true);
            if(isLogLoaded()){
                document.getElementById("PlotButton").disabled = false;
            }
        } else {
            updateButtonColor('loadDatabaseButton',false);
        }
    } catch (error) {
        console.error("Error during database loading process:", error);
    }
*/
    await databaseHandler.loadDatabase();
    console.log("Database loaded:", database);
    if (database) {
        extractDropdownContent();
        populateSignals();
        updateButtonColor('loadDatabaseButton', true);
        if (isLogLoaded()) {
            document.getElementById("PlotButton").disabled = false;
        }
    } else {
        updateButtonColor('loadDatabaseButton', false);
    }

}

/******************** Button Log ********************/
// On button click: Load Log
document.addEventListener("DOMContentLoaded", () => {
    const loadLogBtn = document.getElementById("loadLogButton");

        if (loadLogBtn) {
            loadLogBtn.addEventListener("click", async () => {
                try {
                // Step 1: Let the user select a file
                const file = await selectFileLOG();

                // Step 2: Parse the file content
                const parsedData = await parseFileLOG(file);

                // Step 3: Load the global log in unified JSON format
                buildUnifiedLog(parsedData);

                if(isLogLoaded()){

                    updateButtonColor('loadLogButton',true);

                    if(databaseHandler.isDatabaseLoaded()){
                        // Enable the "Generate Plot" button
                        document.getElementById("PlotButton").disabled = false;
                    }
                } else {
                    updateButtonColor('loadLogButton',false);
                }
            } catch (error) {
                console.error("Error during log loading process:", error);
            }
        });
    }
});


/******************** Plot listener ********************/
// Update plot according to changes in configuration sidebar
function addConfigListeners() {
    // Add listener for mode selection
    document.querySelectorAll('.line-mode').forEach(selector => {
        selector.addEventListener('change', updatePlot);
    });

    // Add listener for line width change
    document.querySelectorAll('.line-width').forEach(slider => {
        slider.addEventListener('input', function (event) {
            const lineWidthValue = event.target.value;
            event.target.previousElementSibling.querySelector('.line-width-value').textContent = lineWidthValue;
            updatePlot();
        });
    });

    // Add listener for marker size change
    document.querySelectorAll('.marker-size').forEach(slider => {
        slider.addEventListener('input', function (event) {
            const markerSizeValue = event.target.value;
            const markerSizeSpan = event.target.parentNode.querySelector('.marker-size-value');
            if (markerSizeSpan) {
                markerSizeSpan.textContent = markerSizeValue;
            }
            updatePlot();
        });
    });

    // Add listener for color swatch click
    document.querySelectorAll('.color-palette').forEach(palette => {
        palette.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', function (event) {
                // Remove the 'selected' class from all swatches within the current palette
                palette.querySelectorAll('.color-swatch').forEach(s => {
                    s.classList.remove('selected');
                });

                // Add the 'selected' class to the clicked swatch
                swatch.classList.add('selected');

                const selectedColor = event.target.getAttribute('data-color');
                const index = event.target.closest('.color-palette').getAttribute('data-index');

                // Update the trace color directly in Plotly
                const traces = Plotly.d3.select('#plot').node().data;
                const trace = traces[index];

                // Ensure trace.line exists before setting color
                if (!trace.line) {
                    trace.line = {}; // Initialize line object if it doesn't exist
                }
                trace.line.color = selectedColor;
                
                // Update marker color as well if it's used
                if (!trace.marker) {
                    trace.marker = {}; // Initialize marker object if it doesn't exist
                }
                trace.marker.color = selectedColor;

                // Update signal name color to match trace color
                /*const signalNameElement = document.querySelector(`.signal-name[data-index="${index}"]`);
                if (signalNameElement) {
                    signalNameElement.style.color = color;
                }*/

                updatePlot();
            });
        });
    });

    document.querySelectorAll(".y-axis-selector").forEach(select => {
        select.addEventListener("change", event => {
            const index = event.target.dataset.index;
            const selIndex = event.target.selectedIndex;
            const newYAxis = selIndex === 0 ? "y" : `y${selIndex + 1}`; //y, y2, y3 are used in the trace
            const axisKey = selIndex === 0 ? "yaxis" : `yaxis${selIndex + 1}`; //yaxis, yaxis2, yaxis3 are used in the layout

            // Update the trace's yaxis property
            plotData.traces[index].yaxis = newYAxis;
            
            // If axis is in use by a trace, make it visible in the layout
            const yInUse =  plotData.isAxisInUse("y")
            const y2InUse =  plotData.isAxisInUse("y2")
            plotLayout["yaxis"].visible = yInUse;
            plotLayout["yaxis2"].visible = y2InUse;
            plotLayout["yaxis3"].visible = plotData.isAxisInUse("y3");

            // If y and y2 are active, y shall make room for y2
            if (yInUse && y2InUse){
                plotLayout.xaxis.domain = [0.05, 1];
            } else {
                plotLayout.xaxis.domain = [0, 1];
            }

            console.log("Updated plotLayout:", plotLayout);

            updatePlot();
        });
    });


    // Add listener for Min and Max input fields
    document.querySelectorAll('.min-input, .max-input').forEach(input => {
        function handleInputChange(event) {
            let value = parseFloat(event.target.value); // Convert to number
            if (isNaN(value)) return; // Ignore invalid values

            // Get correct dataset (instance) and then correct y axis of that instance
            const index = event.target.dataset.index;
            const axis = plotData.traces[index].yaxis;

            let fieldType = event.target.classList.contains('min-input') ? 'min' : 'max'; // Determine field type
            let MinOrMax = fieldType === 'min' ? 0 : 1; // Min corresponds to range[0], Max to range[1]

            // Update the respective Y-axis property in plotLayout
            updateYAxisProperty(axis, "autorange",  false);
            updateYAxisProperty(axis, "range", { index: MinOrMax, value });

            // Update all fields referring to the same axis
            //updateAllFields(axis, fieldType, value);
             console.log("plotLayout:", plotLayout);

            updatePlot(); // Redraw the plot
        }

        // Trigger on losing focus (blur) or pressing Enter (keydown)
        input.addEventListener('blur', handleInputChange);
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                handleInputChange(event);
            }
        });
    });

}



/******************** Droplist Filter Options ********************/
const filterOptions = document.getElementById("filterOptions");

// Change the selected item when scrolling over the dropdown
filterOptions.addEventListener("wheel", (event) => {
    event.preventDefault(); // Prevent the page from scrolling

    // Get the current selected index
    const currentIndex = filterOptions.selectedIndex;

    // Calculate the new index based on scroll direction
    let newIndex = currentIndex;
    if (event.deltaY > 0) {
        // Scroll down, move to the next item
        newIndex = Math.min(currentIndex + 1, filterOptions.options.length - 1);
    } else {
        // Scroll up, move to the previous item
        newIndex = Math.max(currentIndex - 1, 0);
    }

    // Set the new index as the selected option
    filterOptions.selectedIndex = newIndex;

    // Update the selected index
    if (newIndex !== currentIndex) {
        filterOptions.selectedIndex = newIndex;

        // Manually trigger the change event
        const changeEvent = new Event("change", { bubbles: true });
        filterOptions.dispatchEvent(changeEvent);
    }
});

/******************** Checkbox Sources ********************/

// Event listener for the dropdown selection change
document.getElementById('filterOptions').addEventListener('change', function () {
    populateCheckboxGroup(this.value);
});

/**
 * Populates the checkbox group based on the selected filter option.
 * 
 * @param {string} filter - The selected filter value from the dropdown.
 */
function populateCheckboxGroup(filter) {
    // Get the checkbox group container
    const checkboxGroup = document.querySelector('#checkbox-sources .checkbox-group');

    // Clear existing content
    checkboxGroup.innerHTML = '';

    const database = databaseHandler.getDatabase();
    const dropdownContent = databaseHandler.getDropdownContent();
    
    // Handle case where the database is not loaded
    if (!database || !dropdownContent) {
        checkboxGroup.innerHTML = `<p>Please load a database to apply filters.</p>`;
        return;
    }

    // Populate checkboxes based on the selected filter
    if (filter === 'noFilter') {
        checkboxGroup.innerHTML = `<p>No filter applied.</p>`;
        // Do not populate sources, but call a function to handle signals if needed
        populateSignals();
    } else if (filter === 'filterById') {
        // Combine IDs and message names into "ID Name" format
        const idLabels = dropdownContent.ID.map((id, index) => `${id} (${dropdownContent.MsgName[index]})`);
        populateCheckboxList(idLabels, checkboxGroup, 'No IDs available.');
    } else if (filter === 'filterByName') {
        // Combine IDs and message names into "ID Name" format
        const NamedLabels = dropdownContent.MsgName.map((name, index) => `${name} (${dropdownContent.ID[index]})`);
        populateCheckboxList(NamedLabels, checkboxGroup, 'No Names available.');
    } else if (filter === 'filterBySender') {
        populateCheckboxList(dropdownContent.Sender, checkboxGroup, 'No senders available.');
    }
}

/**
 * Helper function to populate a list of checkboxes.
 * 
 * @param {string[]} list - The list of items to populate as checkboxes.
 * @param {HTMLElement} container - The container to populate.
 * @param {string} emptyMessage - The message to display if the list is empty.
 */
function populateCheckboxList(list, container, emptyMessage) {
    if (list.length > 0) {
        // Sort the list alphabetically
        list.sort((a, b) => a.localeCompare(b));

        list.forEach(item => {
            container.innerHTML += `
                <label><input type="checkbox" value="${item}"> ${item}</label>`;
        });
    } else {
        container.innerHTML = `<p>${emptyMessage}</p>`;
    }
}


/******************** Checkbox Signals ********************/
// Event listener for changes in the checkbox-sources
document.querySelector('#checkbox-sources .checkbox-group').addEventListener('change', function (event) {
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        populateSignals();
    }
});

/**
 * Populates the checkbox-signals container based on selected sources (or displays all signals if no source is selected).
 */
function populateSignals() {
    const checkboxGroup = document.querySelector('#checkbox-signals .checkbox-group');
    const selectedSources = Array.from(
        document.querySelectorAll('#checkbox-sources .checkbox-group input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    // Clear the existing content
    checkboxGroup.innerHTML = '';

    // Use a Set to collect unique signals
    const allSignals = new Set();

    const database = databaseHandler.getDatabase();

    // If no sources are selected, display all available signals
    if (selectedSources.length === 0) {
        database.messages.forEach((message) => {
            message.signals.forEach((signal) => {
                allSignals.add(`${signal.name} (${message.name})`);
            });
        });
    } else {
        // If sources are selected, filter by ID or Sender
        selectedSources.forEach((source) => {
        // Determine filter type based on dropdown selection
        const filterType = document.getElementById('filterOptions').value;

        selectedSources.forEach((source) => {
            if (filterType === 'filterById') {
                // Extract only the ID (remove the concatenated message name)
                const idOnly = source.split(' (')[0];

                // Filter by ID using the extracted ID
                const message = database.messages.find((msg) => msg.id === idOnly);
                if (message) {
                    message.signals.forEach((signal) => {
                        allSignals.add(`${signal.name} (${message.name})`);
                    });
                }
            } else if (filterType === 'filterByName') {
                // Extract only the Name (remove the concatenated id)
                const NameOnly = source.split(' (')[0];

                // Filter by ID using the extracted ID
                const message = database.messages.find((msg) => msg.name === NameOnly);
                if (message) {
                    message.signals.forEach((signal) => {
                        allSignals.add(`${signal.name} (${message.name})`);
                    });
                }

            } else if (filterType === 'filterBySender') {
                // Filter by Sender
                database.messages
                    .filter((msg) => msg.sender === source)
                    .forEach((message) => {
                        message.signals.forEach((signal) => {
                            allSignals.add(`${signal.name} (${message.name})`);
                        });
                    });
            }
        });

        });
    }

    // Convert the Set to an array, sort it alphabetically, and populate the checkboxes
    const sortedSignals = Array.from(allSignals).sort((a, b) => a.localeCompare(b));

    if (sortedSignals.length > 0) {
        sortedSignals.forEach((signal) => {
            checkboxGroup.innerHTML += `
                <label><input type="checkbox" value="${signal}"> ${signal}</label>`;
        });
    } else {
        checkboxGroup.innerHTML = `<p>No signals available for the selected sources.</p>`;
    }
}


/**
 * Retrieves a list of signals for a given source.
 *
 * @param {string} source - The selected source (ECU, Node, or ID).
 * @returns {string[]} - A list of signals associated with the source.
 */
function getSignalsForSource(source) {
    // Ensure the appState is available
    if (!appState.parsedCSV || appState.parsedCSV.length === 0) {
        console.error("No CSV data loaded.");
        return [];
    }

    // Extract the relevant indices for filtering
    const headerRow = appState.parsedCSV[0]; // Assuming the first row is the header
    const signalIndex = headerRow.findIndex(col => col.toUpperCase() === 'SIGNALS');
    const ecuIndex = headerRow.findIndex(col => col.toUpperCase() === 'ECU');
    const nodeIndex = headerRow.findIndex(col => col.toUpperCase() === 'NODE');
    const idIndex = headerRow.findIndex(col => col.toUpperCase() === 'ID');

    if (signalIndex === -1) {
        console.error("SIGNALS column not found in CSV.");
        return [];
    }

    // Identify the column to compare against based on the source type
    const sourceColumnIndex =
        appState.ECUs.includes(source) ? ecuIndex :
        appState.Nodes.includes(source) ? nodeIndex :
        appState.IDs.includes(source) ? idIndex : -1;

    if (sourceColumnIndex === -1) {
        console.error("Invalid source type.");
        return [];
    }

    // Filter signals associated with the selected source
    const matchingSignals = appState.parsedCSV
        .slice(1) // Skip the header row
        .filter(row => row[sourceColumnIndex]?.trim() === source)
        .map(row => row[signalIndex]?.trim()) // Extract the signal column
        .filter(signal => signal); // Exclude undefined or empty values

    return [...new Set(matchingSignals)]; // Return unique signals
}

/******************** Button Plot ********************/
/**
 * Processes all selected checkboxes within the container checkbox-signals, 
 * generates a Plotly trace for each selected signal, and adds the traces to the global plotData. 
 * This function is triggered when the "PlotButton" is clicked.
 */

document.addEventListener("DOMContentLoaded", () => {
    const PlotBtn = document.getElementById("PlotButton");
        if (PlotBtn) {
            PlotBtn.addEventListener("click", async () => {
                try {
                    // Get the checkbox container
                    const checkboxContainer = document.getElementById('checkbox-signals');

                    // Check if the container exists
                    if (!checkboxContainer) {
                        console.error("Checkbox container with ID 'checkbox-signals' not found.");
                        return;
                    }

                    // Get all checked checkboxes within the container
                    const selectedCheckboxes = Array.from(
                        checkboxContainer.querySelectorAll('input[type="checkbox"]:checked')
                    );

                    if (selectedCheckboxes.length === 0) {
                        console.warn("No signals selected for trace generation.");
                        return;
                    }

                    // Get signals selected in the checkbox
                    const selectedSignals = getSelectedSignals();

                    // sort and convert log based on signals selected
                    const processedLogs = processSelectedSignals(selectedSignals);

                    // Clear any previous traces to generate a fresh plot
                    plotData.clearTraces();

                    // Generate traces based on processed log
                    const traces = generatePlotlyDatasets(processedLogs);

                    // Add the trace to the global plotData
                    plotData.addData(traces); 
                    
                    /*const dummytrace = {
                        mode: "lines+markers",
                        name: "Dummy-Signal",
                        type: "scatter",
                        yaxis: 'y2',
                        x: ["2025-01-28T15:07:54.275Z", "2025-01-28T15:07:54.375Z"],
                        y: [20,20]
                    };*/

                    //plotData.addData(dummytrace); 

                    generatePlot();
                    
                    addConfigListeners();

                } catch (error) {
                    console.error("Error during plot process:", error);
                }
            });
        }
    });

/**
 * Extracts the names of selected signals from the checkbox-signals container.
 * @returns {Array<string>} - Array of selected signal names.
 */
function getSelectedSignals() {
    const checkboxes = document.querySelectorAll('#checkbox-signals .checkbox-group input[type="checkbox"]:checked');
    const selectedSignals = Array.from(checkboxes).map((checkbox) => {
        // Extract signal name from "Signal1 (Message1)" format
        const fullName = checkbox.value; // Example: "Signal1 (Message1)"
        return fullName.split(' (')[0]; // Extract "Signal1"
    });
    return selectedSignals;
}

/**
 * Processes the log to extract values for selected signals.
 * @param {Array<string>} selectedSignals - List of selected signal names.
 */
function processSelectedSignals(selectedSignals) {
    const processedLogs = {}; // Object to store processed logs for each signal

    // Iterate over the selected signals
    selectedSignals.forEach((signalName) => {
        // Find the corresponding messages in the database
        const databaseSignal = findSignalInDatabase(signalName);
        if (!databaseSignal) {
            console.warn(`Signal "${signalName}" not found in the database.`);
            return; // Skip if the signal is not in the database
        }

        // Find all message IDs associated with this signal
        const messageId = databaseSignal.messageId;

        // Filter log entries by message ID
        const filteredMessages = log.filter((msg) => parseInt(msg.id, 16) === parseInt(messageId, 16));


        // Process the log entries for this signal
        const signalLog = filteredMessages.map((msg) => {
            const rawValue = extractRawValue(
                msg.data,
                databaseSignal.startBit,
                databaseSignal.length,
                databaseSignal.byteOrder
            );

            // Apply scaling and offset
            const scaledValue = rawValue * databaseSignal.scaling + databaseSignal.offset;

            return {
                timestamp: msg.timestamp, // Timestamp in seconds
                value: scaledValue        // Scaled signal value
            };
        });

        // Store the processed log for this signal
        processedLogs[signalName] = signalLog;
    });

    return processedLogs; // Return the processed logs for further use
}

/**
 * Finds a signal in the database by its name.
 * @param {string} signalName - Name of the signal.
 * @returns {Object|null} - Signal object with messageId and properties, or null if not found.
 */
function findSignalInDatabase(signalName) {
    const database = databaseHandler.getDatabase();
    for (const message of database.messages) {
        for (const signal of message.signals) {
            if (signal.name === signalName) {
                return {
                    messageId: message.id,
                    startBit: signal.startBit,
                    length: signal.length,
                    byteOrder: signal.byteOrder,
                    scaling: signal.scaling,
                    offset: signal.offset,
                    valueType: signal.valueType
                };
            }
        }
    }
    return null; // Signal not found
}

/**
 * Extracts a raw value from a CAN message payload.
 * @param {Array} data - CAN message data as an array of bytes.
 * @param {number} startBit - The start bit of the signal.
 * @param {number} length - The length of the signal in bits.
 * @param {string} byteOrder - "LittleEndian" or "BigEndian".
 * @returns {number} - Extracted raw value.
 */
function extractRawValue(data, startBit, length, byteOrder) {
    const startByte = Math.floor(startBit / 8);
    const endByte = Math.ceil((startBit + length) / 8);
    const bitOffset = startBit % 8;

    // Extract relevant bytes
    let valueBytes = data.slice(startByte, endByte);

    // Handle byte order
    if (byteOrder === "BigEndian") {
        valueBytes = valueBytes.reverse();
    }

    // Convert to binary and extract bits
    const binaryString = valueBytes.map((byte) => byte.toString(2).padStart(8, '0')).join('');
    const rawBinary = binaryString.substring(bitOffset, bitOffset + length);

    // Convert binary to integer
    return parseInt(rawBinary, 2);
}


/******************** Plot Container ********************/
window.addEventListener('resize', () => {
    Plotly.Plots.resize('plot'); // Resizes the Plotly chart
});
