
/**
 * main.js aims to make the integration between user interface and
 * file handling processes in js
 */

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
            handleFileSelect(event);
        });
        fileInput.click();
    }, 5);
}

// On button click: Load Log
function loadLog() {
    //sample code: populate checkbox
    const checkboxGroup = document.querySelector(`#checkbox-signals .checkbox-group`);
    checkboxGroup.innerHTML = ` 
    <label><input type="checkbox" id="cb-log-1"> Log Option 1</label> 
    <label><input type="checkbox" id="cb-log-2"> Log Option 2</label> 
    <label><input type="checkbox" id="cb-log-3"> Log Option 3</label> 
    <label><input type="checkbox" id="cb1-1"> Option 1</label>
    `;
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

function populateCheckboxGroup(option) {
    const checkboxGroup = document.querySelector('#checkbox-sources .checkbox-group');
    
    if (!checkboxGroup) {
        console.error('Checkbox group not found!');
        return;
    }

    // Clear the existing checkboxes
    checkboxGroup.innerHTML = '';

    // Populate checkboxes based on the selected option
    if (option === 'noFilter') {
        checkboxGroup.innerHTML = `<p>No filter applied.</p>`;
    } else if (option === 'filterById') {
        checkboxGroup.innerHTML = `
            <label><input type="checkbox" id="cb-id-1"> ID 0x001</label>
            <label><input type="checkbox" id="cb-id-2"> ID 0x002</label>
            <label><input type="checkbox" id="cb-id-3"> ID 0x003</label>
        `;
    } else if (option === 'filterByNode') {
        checkboxGroup.innerHTML = `
            <label><input type="checkbox" id="cb-node-1"> ECU 1</label>
            <label><input type="checkbox" id="cb-node-2"> ECU 2</label>
            <label><input type="checkbox" id="cb-node-3"> ECU 3</label>
        `;
    }
}

// Event listener for the dropdown selection change
document.getElementById('filterOptions').addEventListener('change', function() {
    populateCheckboxGroup(this.value);
});

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

/*async function uploadFile() {
    //const fileInput = document.getElementById('fileInput');
    //const formData = new FormData();
    //formData.append('file', fileInput.files[0]);

    // Example data for the plot
    const xData1 = [0, 1, 1.5, 2, 3, 4];
    const yData1 = [0, 1, 0.8, 0, 1, 0];  // Data for the first line
    const xData2 = [1, 2, 3, 4];
    const yData2 = [2, 3, 2, 3];   // Data for the second line
    const xData3 = [0, 2, 3, 4];
    const yData3 = [2.9, 2.8, 2.5, 1.1];  // Data for the third line

    // Plotting the graph
    const trace1 = {
        x: xData1,
        y: yData1,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Line 1'
    };
    const trace2 = {
        x: xData2,
        y: yData2,
        type: 'scatter',
        mode: 'lines',
        name: 'Line 2'
    };
    const trace3 = {
        x: xData3,
        y: yData3,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Line 3'
    };
    // Combine all traces
    const data = [trace1, trace2, trace3];
    // Layout settings
    const layout = {
        title: 'Multiple Lines Plot',
        xaxis: { title: 'X Axis' },
        yaxis: { title: 'Y Axis' }
    };

    // Plot the graph with all three lines
    Plotly.newPlot('plot', data, layout);    
}*/
