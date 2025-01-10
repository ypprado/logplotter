
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




/******************** Main Sidebar ********************/
// On button click: Load Database
function loadDatabase() {
    console.log("Button Load Database clicked");
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';

    // Wait a little before triggering the click
    setTimeout(() => {
        fileInput.addEventListener('change', function(event) {
            console.log("File selected (event listener triggered)");
            handleFileSelectDatabase(event);
        });
        fileInput.click();
    }, 5);
}

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

// Update plot according to changes in configuration sidebar
function addConfigListeners() {
    // Add listener for type selection
    const typeSelectors = document.querySelectorAll('.line-type');
    typeSelectors.forEach(selector => {
        selector.addEventListener('change', updatePlot);
    });

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
            event.target.nextElementSibling.textContent = lineWidthValue;
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

// Optional: highlight the dropdown on hover
/*filterOptions.addEventListener("mouseover", () => {
    filterOptions.focus();
});

filterOptions.addEventListener("mouseout", () => {
    filterOptions.blur();
});*/



/******************** Checkbox Sources ********************/

// Event listener for the dropdown selection change
document.getElementById('filterOptions').addEventListener('change', function() {
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

    // Handle case where CSV is not loaded
    if (!appState.isCSVLoaded) {
        checkboxGroup.innerHTML = `<p>Please load a database to apply filters.</p>`;
        return;
    }

    // Populate checkboxes based on the selected filter
    if (filter === 'noFilter') {
        checkboxGroup.innerHTML = `<p>No filter applied.</p>`;
    } else if (filter === 'filterByECU') {
        populateCheckboxList(appState.ECUs, checkboxGroup, 'No ECUs available.');
    } else if (filter === 'filterById') {
        populateCheckboxList(appState.IDs, checkboxGroup, 'No IDs available.');
    } else if (filter === 'filterByNode') {
        populateCheckboxList(appState.Nodes, checkboxGroup, 'No Nodes available.');
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
function populateSignals() {
    const checkboxGroup = document.querySelector('#checkbox-signals .checkbox-group');
    const selectedSources = Array.from(
        document.querySelectorAll('#checkbox-sources .checkbox-group input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    // Clear the existing content
    checkboxGroup.innerHTML = '';

    // If no sources are selected, show a default message
    if (selectedSources.length === 0) {
        checkboxGroup.innerHTML = `<p>Select a source to see the signals.</p>`;
        return;
    }

    // Collect unique signals associated with the selected sources
    const allSignals = new Set();
    selectedSources.forEach(source => {
        const signals = getSignalsForSource(source);
        signals.forEach(signal => allSignals.add(signal)); // Add to Set to ensure uniqueness
    });

    // Populate signals
    if (allSignals.size > 0) {
        Array.from(allSignals).forEach(signal => {
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

/******************** Right Sidebar ********************/
// Right Sidebar Show/Hide
document.getElementById('showConfigBtn').addEventListener('click', function() {
    const rightSidebar = document.getElementById('rightSidebar');
    const currentRightPosition = rightSidebar.style.right;

    // Toggle sidebar visibility by adjusting the right property
    if (currentRightPosition === '0px') {
        rightSidebar.style.right = '-400px'; // Hide the sidebar
    } else {
        rightSidebar.style.right = '0'; // Show the sidebar
    }
});


/******************** Plot Container ********************/
window.addEventListener('resize', () => {
    Plotly.Plots.resize('plot'); // Resizes the Plotly chart
});
