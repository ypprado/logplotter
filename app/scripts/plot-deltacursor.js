let deltaModeActive = false;
let deltaPointA = null;
let deltaPointB = null;
let originalHovermode = null;

function toogleDeltaCursor() {
    deltaModeActive = !deltaModeActive;
    const plotEl = document.getElementById('plot');
    
    if (deltaModeActive) {
        plotEl.style.cursor = 'crosshair';
        deltaPointA = null;
        deltaPointB = null;
        
        // Clear any previous annotations and shapes when starting a new measurement cycle
        Plotly.relayout(plotEl, { annotations: [], shapes: [] });
        
        // Store the original hovermode and switch to 'closest'
        if (!originalHovermode) {
            originalHovermode = plotEl._fullLayout.hovermode || 'compare';
        }
        Plotly.relayout(plotEl, { hovermode: 'closest' });
        
        // Delay adding the click listener to avoid capturing the toggle click
        setTimeout(() => { plotEl.on('plotly_click', deltaClickHandler); }, 0);
        console.log("Delta Cursor activated.");
    } else {
        plotEl.style.cursor = 'default';
        // Remove our click listener by overriding with a no-op function
        plotEl.on('plotly_click', function(){});
        
        // Revert hovermode and clear annotations and shapes
        if (originalHovermode) {
            Plotly.relayout(plotEl, { hovermode: originalHovermode });
            originalHovermode = null;
        }
        Plotly.relayout(plotEl, { annotations: [], shapes: [] });
        console.log("Delta Cursor deactivated.");
    }
}

function deltaClickHandler(data) {
    // Ignore clicks if delta mode is not active
    if (!deltaModeActive) return;
    if (!data.points || data.points.length === 0) return;
    
    const point = data.points[0];
    const x = point.x;
    const y = parseFloat(point.y.toFixed(3));
    const plotEl = document.getElementById('plot');
    
    if (!deltaPointA) {
        // New measurement cycle: clear previous annotations and shapes
        Plotly.relayout(plotEl, { annotations: [], shapes: [] });
        deltaPointA = { x: x, y: y };
        console.log("Point A set at:", deltaPointA);
        addAnnotationAndLines(x, y);
    } else {
        deltaPointB = { x: x, y: y };
        console.log("Point B set at:", deltaPointB);
        addAnnotationAndLines(x, y);
        
        const deltaX = deltaPointB.x - deltaPointA.x;
        const deltaY = deltaPointB.y - deltaPointA.y;
        console.log("Delta X:", deltaX, "Delta Y:", deltaY);
        
        // (Optionally, you could add an annotation for the delta measurement itself here.)
        
        // Reset for the next measurement cycle
        deltaPointA = null;
        deltaPointB = null;
    }
}

// Adds an annotation and dashed gray lines for the given point.
// The annotation text is formatted as "X: <time><br>Y: <value>" with left-aligned text.
// Two lines are drawn: one vertical from the point to y=0 (x-axis) and one horizontal from the point to x=0 (y-axis).
function addAnnotationAndLines(x, y) {
    const plotEl = document.getElementById('plot');
    let timePart = x;
    if (typeof x === 'string' && x.indexOf(' ') !== -1) {
        // Extract only the time portion (remove day, month, year)
        timePart = x.split(' ')[1];
    }
    const annotationText = "X: " + timePart + "<br>Y: " + y;
    
    // Determine diagonal offset for inclination
    let offsetX = 50; // Horizontal shift
    let offsetY = -50; // Vertical shift

    // Adjust the annotation position dynamically
    if (x < (plotEl._fullLayout.xaxis.range[0] + plotEl._fullLayout.xaxis.range[1]) / 2) {
        // If the point is on the left half, move annotation to the right
        offsetX = 50;
    } else {
        // If the point is on the right half, move annotation to the left
        offsetX = -50;
    }

    let newAnnotation = {
        text: annotationText,
        x: x,
        y: y,
        xref: 'x',
        yref: 'y',
        showarrow: true,
        arrowhead: 7,
        ax: offsetX,
        ay: offsetY,
        xanchor: offsetX > 0 ? 'left' : 'right'
    };
    
    // Build shapes for the dashed lines:
    let verticalLine = {
        type: 'line',
        x0: x,
        x1: x,
        y0: y,
        y1: 0, // Extend vertically to the x-axis
        line: {
            color: 'gray',
            dash: 'dash'
        },
        xref: 'x',
        yref: 'y'
    };
    
    // Determine the first x value in the dataset
    /*let firstXValue = plotEl.data.length > 0 
        ? Math.min(...plotEl.data[0].x.map(val => (typeof val === "string" ? Date.parse(val) : val)).filter(num => !isNaN(num))) 
        : plotEl._fullLayout.xaxis.range[0];*/

    // Determine the first x value in the dataset without converting it into a timestamp
    let firstXValue = plotEl.data.length > 0 
    ? plotEl.data[0].x[0]  // Simply take the first x-value in the dataset
    : plotEl._fullLayout.xaxis.range[0];

    let horizontalLine = {
        type: 'line',
        x0: x,
        x1: firstXValue,
        y0: y,
        y1: y,
        line: {
            color: 'gray',
            dash: 'dash'
        },
        xref: 'x',
        yref: 'y'
    };
    
    // Get the current annotations and shapes (if any)
    let currentAnnotations = (plotEl.layout && plotEl.layout.annotations) ? plotEl.layout.annotations.slice() : [];
    let currentShapes = (plotEl.layout && plotEl.layout.shapes) ? plotEl.layout.shapes.slice() : [];
    
    // Append the new annotation and shapes.
    currentAnnotations.push(newAnnotation);
    currentShapes.push(verticalLine);
    currentShapes.push(horizontalLine);
    
    // Update the plot with the new annotations and shapes.
    Plotly.relayout(plotEl, { annotations: currentAnnotations, shapes: currentShapes });
}