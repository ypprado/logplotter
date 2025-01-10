
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

        // Load the CSV data into the global state
        appState.loadCSV(fileContent);

        // Log the parsed content
        //console.log("Raw appState:", appState.rawCSV);
        console.log("Parsed appState:", appState.parsedCSV);
        
        // Extract lists and update global state
        appState.ECUs = ExtractList(fileContent,Index.ECU);
        appState.IDs = ExtractList(fileContent,Index.ID);
        appState.Nodes = ExtractList(fileContent,Index.NODE);
        appState.isCSVLoaded = true; // Mark the database as loaded

        // Log the parsed content
        //console.log("Extracted ECUs:", appState.ECUs);
        //console.log("Extracted IDs:", appState.IDs);
        //console.log("Extracted Nodes:", appState.Nodes);
    };

    reader.onerror = function () {
        console.error("Error reading database:", reader.error);
    };

    reader.readAsText(file); // Read file as text. todo: WHY?
    console.log("End!");
}

/**
 * Extracts a list of unique values from a specified column of the CSV.
 * 
 * @param {string} csvContent - The content of the CSV file.
 * @param {number} index - The column index (as per the `Index` object).
 * @returns {string[]} - A list of unique strings from the specified column.
 */
function ExtractList(csvContent, index) {
    // Split the content into lines
    const lines = csvContent.split("\n");

    // Check if the CSV has at least one line (header) and data rows
    if (lines.length <= 1) {
        console.error("CSV is empty or contains no data rows.");
        return [];
    }

    // Extract the header row to determine column mapping
    const header = lines[0].split(",").map(value => value.trim());
    const columnIndex = header.findIndex(col => col.toUpperCase() === Object.keys(Index)[index].toUpperCase());

    if (columnIndex === -1) {
        console.error(`Invalid index or column not found: ${Object.keys(Index)[index]}`);
        return [];
    }

    // Extract unique values from the specified column
    const uniqueValues = new Set();
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(value => value.trim());
        if (row.length > columnIndex && row[columnIndex] !== "") {
            uniqueValues.add(row[columnIndex]);
        }
    }

    // Convert the Set to an array and return it
    return Array.from(uniqueValues);
}
