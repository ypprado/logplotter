/**
 * This file contains information that shall be used across the application
 */

// Global state to store the extracted data
const appState = {
    ECUs: [],
    IDs: [],
    Nodes: [],
    isDatabaseLoaded: false, // Tracks if a database has been loaded
    rawCSV: '',       // Raw CSV content as a string
    parsedCSV: [],    // Parsed CSV content as an array of rows
    loadCSV(content) {
        this.rawCSV = content;
        this.parsedCSV = this.parseCSV(content);
    },
    parseCSV(content) {
        // Split the content into rows and parse each row into columns
        return content
            .trim() // Remove unnecessary leading/trailing whitespace
            .split("\n") // Split into rows
            .map(row => row.split(",").map(value => value.trim())); // Parse columns
    },
};


const Index = {
    ECU: 0,
    NODE: 1,
    ID: 2,
    SIGNAL: 3,
};