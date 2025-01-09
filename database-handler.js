
function handleFileSelectDatabase(event) {
    console.log("Database selected:", event);

    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        console.log("Database loaded.");

        // Extract lists and update global state
        appState.ECUs = ExtractList(fileContent,Index.ECU);
        appState.IDs = ExtractList(fileContent,Index.ID);
        appState.Nodes = ExtractList(fileContent,Index.NODE);
        appState.isCSVLoaded = true; // Mark the database as loaded

        console.log("Extracted ECUs:", appState.ECUs);
        console.log("Extracted IDs:", appState.IDs);
        console.log("Extracted Nodes:", appState.Nodes);
    };

    reader.onerror = function () {
        console.error("Error reading database:", reader.error);
    };

    reader.readAsText(file); // Read file as text. todo: WHY?
    console.log("End!");
}

/**
 * Extracts the list of ECU/IDs/Nodes from the first line of the CSV.
 * 
 * @param {string} csvContent - The content of the CSV file.
 * @param index - as per object Index (app-state.js)
 * @returns {string[]} - A list of string.
 */
function ExtractList(csvContent, index) {
    // Split the content into lines
    const lines = csvContent.split("\n");

    // Check if there is at least one line
    if (lines.length === 0) {
        console.error("CSV is empty.");
        return [];
    }
    
    // Get the first line and split it by commas
    const selectedLine  = lines[index]
        .split(",")
        .map(value => value.trim())
        .filter(value => value !== ""); // Ignore empty cells;

    // Ensure we skip the first column (title) and filter out empty cells
    // Return the extracted list
    return selectedLine .slice(1);
}