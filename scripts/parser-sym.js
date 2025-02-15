/** 
 * Parses the SYM file content into structured data.
 * @param {string} content - The raw SYM file content.
 * @returns {Object} - Parsed messages and nodes.
 */
function parseSYM(content) {
    const lines = content.split("\n").map(line => line.trim());
    const messages = [];
    const nodes = new Set();
    const signals = {}; // Store signals separately before assigning to frames
    let currentMessage = null;
    
    // First Pass: Extract all signals
    lines.forEach((line) => {
        const signalDefMatch = line.match(/^Sig="([^"]+)"\s+(\w+)\s+(\d+)(\s+-m)?/);
        if (signalDefMatch) {
            const name = signalDefMatch[1];
            const type = signalDefMatch[2];
            const length = parseInt(signalDefMatch[3], 10);
            const isBigEndian = !!signalDefMatch[4];
            
            signals[name] = {
                name,
                length,
                byteOrder: isBigEndian ? "BigEndian" : "LittleEndian",
                valueType: type.includes("unsigned") ? "Unsigned" : "Signed",
                scaling: 1.0,
                offset: 0.0,
                valueRange: [0, 1],
                units: "",
                valueDescriptions: {}
            };
            
            // Extract additional attributes
            const attributesMatch = line.match(/\/f:(\d+(?:\.\d+)?)|\/o:(-?\d+(?:\.\d+)?)|\/min:(-?\d+(?:\.\d+)?)|\/max:(-?\d+(?:\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g);
            if (attributesMatch) {
                attributesMatch.forEach(attr => {
                    if (attr.startsWith("/f:")) signals[name].scaling = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/o:")) signals[name].offset = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/min:")) signals[name].valueRange[0] = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/max:")) signals[name].valueRange[1] = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/u:")) signals[name].units = attr.split(":")[1].replace(/"/g, '');
                    if (attr.startsWith("/e:")) signals[name].valueDescriptions = attr.split(":")[1];
                });
            }
        }
    });
    
    // Second Pass: Parse Messages and Assign Signals
    lines.forEach((line) => {
        line = line.trim();
        
        // Detect new message
        const messageMatch = line.match(/^\[(.+)\]$/);
        if (messageMatch) {
            if (currentMessage) messages.push(currentMessage);

            currentMessage = {
                id: null,
                name: messageMatch[1].replace(/"/g, ''),
                dlc: null,
                sender: "Unknown",
                isExtendedId: false,
                signals: []
            };
            return;
        }

        // Parse CAN ID
        const idMatch = line.match(/^ID=([0-9A-Fa-f]+)h$/);
        if (idMatch && currentMessage) {
            currentMessage.id = `0x${parseInt(idMatch[1], 16).toString(16).toUpperCase()}`;
            return;
        }

        // Parse CAN Type
        const typeMatch = line.match(/^Type=(Standard|Extended)$/);
        if (typeMatch && currentMessage) {
            currentMessage.isExtendedId = typeMatch[1] === "Extended";
            return;
        }

        // Parse DLC (message length)
        const dlcMatch = line.match(/^Len=(\d+)$/);
        if (dlcMatch && currentMessage) {
            currentMessage.dlc = parseInt(dlcMatch[1], 10);
            return;
        }

        // Assign Signals to Messages
        const signalRefMatch = line.match(/^Sig="([^"]+)"\s+(\d+)/);
        if (signalRefMatch && currentMessage) {
            const signalName = signalRefMatch[1];
            const startBit = parseInt(signalRefMatch[2], 10);
            
            if (signals[signalName]) {
                const signalCopy = { ...signals[signalName], startBit };
                currentMessage.signals.push(signalCopy);
            }
            return;
        }
    });

    if (currentMessage) messages.push(currentMessage);

    return { messages, nodes: Array.from(nodes) };
}
