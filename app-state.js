/**
 * This file contains information that shall be used across the application
 */

// Global state to store the extracted data
const appState = {
    ECUs: [],
    IDs: [],
    Nodes: [],
    isDatabaseLoaded: false, // Tracks if a database has been loaded
};


const Index = {
    ECU: 0,
    NODE: 1,
    ID: 2,
    SIGNAL: 3,
};