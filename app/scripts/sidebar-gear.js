const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");
const dropText = document.getElementById("drop-text");

function triggerFileInput() {
    fileInput.click(); // Simulate click when container is clicked
}

function handleFileSelect(event) {
    const files = event.target.files || event.dataTransfer.files;
    if (files.length > 0) {
        dropArea.classList.add("active");
        dropText.textContent = files[0].name; // Show file name
    }
}

// Drag-and-drop event listeners
dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("active");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    fileInput.files = e.dataTransfer.files;
    handleFileSelect({ target: fileInput });
});