
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
document.querySelector('#checkbox-sources .checkbox-group').addEventListener('change', function(event) {
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        populateSignals(event.target.value, event.target.checked);
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

    // Collect and merge signals for all selected sources
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
 * @param {string} source - The selected source.
 * @returns {string[]} - A list of signals associated with the source.
 */
function getSignalsForSource(source) {
    // Example mapping (replace with actual signal retrieval logic)
    const signalMapping = {
        ECU1: ['Voltage', 'Current'],
        ECU2: ['Temperature', 'Pressure'],
        ECU3: ['State', 'Error'],
    };

    return signalMapping[source] || [];
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

/*
    //sample code: populate checkbox
    const checkboxGroup = document.querySelector(`#checkbox-signals .checkbox-group`);
    checkboxGroup.innerHTML = ` 
    <label><input type="checkbox" id="cb-log-1"> Log Option 1</label> 
    <label><input type="checkbox" id="cb-log-2"> Log Option 2</label> 
    <label><input type="checkbox" id="cb-log-3"> Log Option 3</label> 
    <label><input type="checkbox" id="cb1-1"> Option 1</label>
    `;*/