// Define the sidebar configurations
const sidebarConfigurations = {
    main: 'mainConfig',
    brush: 'brushConfig',
    gear: 'gearConfig'
};

// Function to toggle between different sidebar configurations
function toggleSidebarContent(configType) {
    // Hide all sidebar contents first
    const allConfigContents = document.querySelectorAll('.sidebar-content');
    allConfigContents.forEach(content => {
        content.classList.remove('active');
    });

    // Show the requested configuration
    const configToShow = sidebarConfigurations[configType];
    const contentToShow = document.getElementById(configToShow);
    if (contentToShow) {
        contentToShow.classList.add('active');
    }
}

// Example function to handle specific display of configuration (e.g., for Brush)
function displayConfigurationControls(data) {
    const configContainer = document.getElementById('lineConfigurations');
    configContainer.innerHTML = '';

    data.forEach((trace, index) => {
        const lineConfig = document.createElement('div');
        lineConfig.classList.add('line-config');
        const lineWidth = trace.line && trace.line.width ? trace.line.width : 2;
        lineConfig.innerHTML = `
            <label>Signal ${trace.name}</label>

            <label>Mode</label>
            <select class="line-mode" data-index="${index}">
                <option value="lines" ${trace.mode === 'lines' ? 'selected' : ''}>Lines</option>
                <option value="markers" ${trace.mode === 'markers' ? 'selected' : ''}>Markers</option>
                <option value="lines+markers" ${trace.mode === 'lines+markers' ? 'selected' : ''}>Lines + Markers</option>
            </select>

            <div class="line-width-row">
                <label>Line Width:</label>
                <span class="line-width-value">${lineWidth}</span>
            </div>
            <input type="range" class="line-width" data-index="${index}" min="1" max="10" value="${lineWidth}" />

        `;
        configContainer.appendChild(lineConfig);
    });
    addConfigListeners();
}
