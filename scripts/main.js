/**
 * main.js aims to make the integration between user interface and
 * processes in js. 
 */

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
            //console.log("sidebarWidth:", sidebarWidth);
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
async function loadDatabaseButton() {
    console.log("Button Load Database clicked");

    try {
        console.log("Starting database load process...");

        // Step 1: Let the user select a file
        const file = await selectFile();

        // Step 2: Parse the file content
        const parsedData = await parseFile(file);

        // Step 3: Load the global database in unified JSON format
        resetGlobalState();
        database = buildUnifiedDatabase(parsedData);
        console.log("Database loaded:", database);

        if(isDatabaseLoaded){
            extractDropdownContent(database); 

            populateSignals();

            // Enable the "Load Log" button TODO place on main every interface related feature
            document.getElementById("loadLogButton").disabled = false;
        }

        // Step 4: Take further steps after the database is loaded
        //proceedWithNextSteps();

    } catch (error) {
        console.error("Error during database loading process:", error);
    }
}

/******************** Button Log ********************/
// On button click: Load Log
function loadLog() {
    console.log("Button Load Log clicked");
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';

    // Wait a little before triggering the click
    setTimeout(() => {
        fileInput.addEventListener('change', function(event) {
            console.log("File selected (event listener triggered)");
            handleFileSelectLog(event);
        });
        fileInput.click();
    }, 5);
}

/******************** Plot listener ********************/
// Update plot according to changes in configuration sidebar
function addConfigListeners() {
    // Add listener for mode selection
    const modeSelectors = document.querySelectorAll('.line-mode');
    modeSelectors.forEach(selector => {
        selector.addEventListener('change', updatePlot);
    });

    // Add listener for line width change
    const widthSliders = document.querySelectorAll('.line-width');
    widthSliders.forEach(slider => {
        slider.addEventListener('input', function (event) {
            const lineWidthValue = event.target.value;
            // Find the .line-width-value within the same container
            const lineWidthSpan = event.target.previousElementSibling.querySelector('.line-width-value');
            lineWidthSpan.textContent = lineWidthValue;
            updatePlot();
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
        const idLabels = dropdownContent.ID.map((id, index) => `${id} ${dropdownContent.MsgName[index]}`);
        populateCheckboxList(idLabels, checkboxGroup, 'No IDs available.');
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
 * Populates the checkbox-signals container based on all selected sources.
 */
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
                const idOnly = source.split(' ')[0];

                // Filter by ID using the extracted ID
                const message = database.messages.find((msg) => msg.id === idOnly);
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
function handleGenerateTraces() {
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

    // Clear any previous traces to generate a fresh plot
    plotData.clearTraces();

    // Loop through the selected checkboxes and generate traces
    selectedCheckboxes.forEach(checkbox => {
        const signalName = checkbox.value; // Assuming the checkbox's value contains the signal name
        const trace = generatePlotlyDataset(signalName); // Generate the trace
        if (trace) {
            plotData.addData(trace); // Add the trace to the global plotData
        }
    });

    console.log(`Generated and added traces for ${selectedCheckboxes.length} signal(s).`);

    generatePlot();
}


/******************** Plot Container ********************/
window.addEventListener('resize', () => {
    Plotly.Plots.resize('plot'); // Resizes the Plotly chart
});
