/**
 * Parses the DBC file content into structured data.
 * 
 * @param {string} content - The raw DBC file content.
 * @returns {Object} - Parsed data including messages and nodes.
 */
function parseDBC(content) {
    const lines = content.split("\n");
    const messages = [];
    const nodes = new Set();
    const valueDescriptions = {}; // Temporary storage for VAL_ data

    let currentMessage = null;

    lines.forEach((line) => {
        line = line.trim();

        // Match message definitions (e.g., "BO_ 256 EngineData: 8 ECU1")
        const messageMatch = line.match(/^BO_\s+(\d+)\s+(\w+):\s+(\d+)\s+(\w+)$/);
        if (messageMatch) {
            if (currentMessage) {
                messages.push(currentMessage);
            }

            currentMessage = {
                id: (parseInt(messageMatch[1], 10) & 0x80000000) !== 0 ? // the leading bit indicates EXT 
                `0x${(parseInt(messageMatch[1], 10) & 0x7FFFFFFF).toString(16).padStart(8, '0').toUpperCase()}` : 
                `0x${parseInt(messageMatch[1], 10).toString(16).padStart(3, '0').toUpperCase()}`,
                name: messageMatch[2],
                dlc: parseInt(messageMatch[3], 10),
                sender: messageMatch[4],
                signals: [],
            };

            nodes.add(messageMatch[4]); // Add sender node
            return;
        }

        // Match signal definitions (e.g., "SG_ EngineSpeed : 0|16@1+ (1,0) [0|8000] \"RPM\"")
        const signalMatch = line.match(
            /^SG_\s+(\w+)\s+(:?\s+M|m(\d+))?\s*:\s+(\d+)\|(\d+)@(\d)([+-])\s+\(([\d.]+),([\d.-]+)\)\s+\[([\d.-]+)\|([\d.-]+)\]\s+"([^"]*)".*$/
        );

        if (signalMatch && currentMessage) {
            const signal = {
                name: signalMatch[1],
                startBit: parseInt(signalMatch[4], 10),
                length: parseInt(signalMatch[5], 10),
                byteOrder: signalMatch[6] === "1" ? "LittleEndian" : "BigEndian",
                valueType: signalMatch[7] === "+" ? "Unsigned" : "Signed",
                scaling: parseFloat(signalMatch[8]),
                offset: parseFloat(signalMatch[9]),
                valueRange: [parseFloat(signalMatch[10]), parseFloat(signalMatch[11])],
                units: signalMatch[12],
                defaultValue: 0, // Default value not included in the DBC definition
            };

            // Check for multiplexer
            if (signalMatch[2]?.trim() === "M") {
                signal.isMultiplexer = true;
            }

            // Check for multiplexed signals
            if (signalMatch[3]) {
                signal.multiplexerValue = parseInt(signalMatch[3], 10);
            }

            currentMessage.signals.push(signal);
            return;
        }

        // Match value descriptions (e.g., "VAL_ 512 F1_Signal3 1 \"State 1\" 2 \"State 2\" ... ;")
        const valueMatch = line.match(/^VAL_\s+(\d+)\s+(\w+)\s+((?:\d+\s+"[^"]*"\s*)+);$/);
        if (valueMatch) {
            const messageId = (parseInt(valueMatch[1], 10) & 0x80000000) !== 0 ? // the leading bit indicates EXT 
            `0x${(parseInt(valueMatch[1], 10) & 0x7FFFFFFF).toString(16).padStart(8, '0').toUpperCase()}` : 
            `0x${parseInt(valueMatch[1], 10).toString(16).padStart(3, '0').toUpperCase()}`;
            const signalName = valueMatch[2];
            const valuePairs = valueMatch[3].match(/(\d+)\s+"([^"]*)"/g);

            if (!valueDescriptions[messageId]) {
                valueDescriptions[messageId] = {};
            }

            valueDescriptions[messageId][signalName] = valuePairs.reduce((acc, pair) => {
                const [value, description] = pair.match(/(\d+)\s+"([^"]*)"/).slice(1, 3);
                acc[value] = description;
                return acc;
            }, {});
        }
    });

    if (currentMessage) {
        messages.push(currentMessage);
    }

    // Add value descriptions to signals
    messages.forEach((msg) => {
        msg.signals.forEach((signal) => {
            const signalDescriptions = valueDescriptions[msg.id]?.[signal.name];
            if (signalDescriptions) {
                signal.valueDescriptions = signalDescriptions;
            }
        });
    });

    return { messages, nodes: Array.from(nodes) };
}
