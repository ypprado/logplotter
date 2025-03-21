document.addEventListener("DOMContentLoaded", function () {
    let basePath = window.location.pathname.includes("/app/") ? "../" : "";

    // Define the navbar HTML directly in JS (avoids fetching delays)
    const navbarHTML = `
    <nav class="navbar">
        <a href="${basePath}index.html" class="nav-link">Home</a>
        <a href="${basePath}app/index.html" class="nav-link">CAN Log Plotter</a>
        <a href="${basePath}shortcuts.html" class="nav-link">Shortcuts</a>
        <a href="${basePath}about.html" class="nav-link">About</a>
    </nav>
    `;

    // Inject the navbar instantly
    document.getElementById("navbar-container").innerHTML = navbarHTML;
});