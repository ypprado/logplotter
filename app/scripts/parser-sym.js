/** 
 * Parses the SYM file content into structured data, including enumerations.
 * @param {string} content - The raw SYM file content.
 * @returns {Object} - Parsed messages and nodes.
 */
export function parseSYM(content) {
    const lines = content.split("\n").map(line => line.trim());
    const messages = [];
    const nodes = new Set();
    const signals = {}; // Store signals separately before assigning to frames
    const enumerations = {}; // Store enumerator mappings
    let currentMessage = null;

    // First Pass: Extract enumerations
    lines.forEach((line) => {
        const enumMatch = line.match(/^Enum=([^()]+)\(([^)]+)\)/);
        if (enumMatch) {
            const enumName = enumMatch[1].trim();
            const enumValues = enumMatch[2].split(",").map(pair => {
                const [key, value] = pair.split("=").map(item => item.trim().replace(/"/g, ""));
                return [key, value];
            });

            enumerations[enumName] = Object.fromEntries(enumValues);
        }
    });

    // Second Pass: Extract all signals
    lines.forEach((line) => {
        const signalDefMatch = line.match(/^Sig="?([^"]+)"?\s+(\w+)\s+(\d+)(\s+-m)?/);
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
                valueDescriptions: {},
                description: "" // Default to empty string
            };

            // Extract additional attributes
            const attributesMatch = line.match(/\/f:(\d+(?:\.\d+)?)|\/o:(-?\d+(?:\.\d+)?)|\/min:(-?\d+(?:\.\d+)?)|\/max:(-?\d+(?:\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g);
            if (attributesMatch) {
                attributesMatch.forEach(attr => {
                    if (attr.startsWith("/f:"))
                        signals[name].scaling = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/o:"))
                        signals[name].offset = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/min:"))
                        signals[name].valueRange[0] = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/max:"))
                        signals[name].valueRange[1] = parseFloat(attr.split(":")[1]);
                    if (attr.startsWith("/u:"))
                        signals[name].units = attr.split(":")[1].replace(/"/g, '');
                    if (attr.startsWith("/e:")) {
                        const enumName = attr.split(":")[1];
                        if (enumerations[enumName]) {
                            signals[name].valueDescriptions = enumerations[enumName];
                        }
                    }
                });
            }

            // Extract optional description from inline comment (e.g., // SAEbs04)
            const descriptionMatch = line.match(/\/\/\s*(.*)$/);
            if (descriptionMatch) {
                signals[name].description = descriptionMatch[1].trim();
            }
        }
    });


    // Third Pass: Parse Messages and Assign Signals
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

        // Parse CAN ID with optional commentary
        const idMatch = line.match(/^ID=([0-9A-Fa-f]+)h(?:\s*\/\/\s*(.*))?$/);
        if (idMatch && currentMessage) {
            currentMessage.id = `0x${parseInt(idMatch[1], 16).toString(16).toUpperCase()}`;
            // If commentary exists, store it in the message (e.g., as 'comment')
            if (idMatch[2]) {
                currentMessage.comment = idMatch[2];
            }
            return;
        }

        // Parse CAN Type 
        const typeMatch = line.match(/^Type=(Standard|Extended)$/);
        if (typeMatch && currentMessage) {
            currentMessage.isExtendedId = typeMatch[1] === "Extended";

            // If the ID was already set, adjust its formatting based on the type
            if (currentMessage.id) {
                let rawId = parseInt(currentMessage.id, 16);

                // If standard, ensure it's only 11 bits
                if (!currentMessage.isExtendedId) {
                    rawId = rawId & 0x7FF;  // Mask to 11-bit for standard ID
                }

                currentMessage.id = currentMessage.isExtendedId
                    ? `0x${rawId.toString(16).toUpperCase().padStart(8, '0')}`  // Extended ID (8 hex digits)
                    : `0x${rawId.toString(16).toUpperCase().padStart(3, '0')}`;  // Standard ID (3 hex digits)
            }

            return;
        }

        // Parse DLC (message length)
        const dlcMatch = line.match(/^Len=(\d+)$/);
        if (dlcMatch && currentMessage) {
            currentMessage.dlc = parseInt(dlcMatch[1], 10);
            return;
        }

        // Assign Signals to Messages
        const signalRefMatch = line.match(/^Sig="?([^"\s]+)"?\s+(\d+)/);
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

    if (currentMessage && currentMessage.dlc != null && currentMessage.id != null && currentMessage.name) {
        messages.push(currentMessage);
    }

    return { messages, nodes: Array.from(nodes) };
}