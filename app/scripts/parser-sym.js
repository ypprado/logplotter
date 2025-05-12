/** 
 * Parses the SYM file content into structured data, including enumerations,
 * multiplexors, metadata, and multi-line enums.
 * @param {string} content - The raw SYM file content.
 * @returns {Object} - Parsed messages, nodes, and file-level metadata.
 */
export function parseSYM(content) {
  const rawLines = content.split("\n");
  const lines = [];
  rawLines.forEach(l => lines.push(l.trim()));

  const messages = [];
  const nodes = new Set();
  const signals = {};
  const enumerations = {};

  let formatVersion;
  let title;

  // Pre‐scan for FormatVersion and Title
  for (let line of lines) {
    if (line.startsWith("FormatVersion=")) {
      formatVersion = line.replace(/^FormatVersion=/, "")
                          .replace(/\/\/.*$/, "")
                          .trim();
    }
    if (line.startsWith("Title=")) {
      title = line.replace(/^Title=/, "")
                  .replace(/^"/, "")
                  .replace(/"$/, "")
                  .trim();
    }
  }

  // First Pass: multi-line enum extraction
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith("Enum=")) {
      let accum = line;
      while (!accum.includes(")")) {
        i++;
        if (i >= lines.length) break;
        accum += " " + lines[i];
      }
      const m = accum.match(/^Enum=([^()]+)\(([\s\S]+)\)$/);
      if (m) {
        const name = m[1].trim();
        const pairs = m[2]
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map(p => p.trim())
          .filter(Boolean);
        const map = {};
        pairs.forEach(pair => {
          const [k, v] = pair.split("=").map(x => x.trim().replace(/^"|"$/g, ""));
          map[k] = v;
        });
        enumerations[name] = map;
      }
    }
  }

  // Second Pass: collect all global signal definitions
  for (let line of lines) {
    const sigMatch = line.match(/^Sig="?([^"]+)"?\s+(\w+)\s+(\d+)(\s+-m)?/);
    if (!sigMatch) continue;

    const name = sigMatch[1];
    const rawType = sigMatch[2].toLowerCase();
    const length = parseInt(sigMatch[3], 10);
    const isBig = !!sigMatch[4];

    // valueType
    let valueType;
    if (rawType === "string") {
      valueType = "String";
    } else if (rawType === "unsigned") {
      valueType = "Unsigned";
    } else {
      valueType = "Signed";
    }

    signals[name] = {
      name,
      length,
      byteOrder: isBig ? "BigEndian" : "LittleEndian",
      valueType,
      scaling: 1.0,
      offset: 0.0,
      valueRange: [0, 1],
      units: "",
      valueDescriptions: {},
      description: "",
      // mark multiplexer if "-m" present
      isMultiplexer: !!sigMatch[4],
      // value placeholder; actual multiplexed signals handled by Mux= lines
      multiplexerValue: undefined,
    };

    // attributes (/f:, /o:, /min:, /max:, /u:, /e:)
    const attrs = line.match(/\/[fo]:(-?\d+(\.\d+)?)|\/min:(-?\d+(\.\d+)?)|\/max:(-?\d+(\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g);
    if (attrs) {
      attrs.forEach(attr => {
        if (attr.startsWith("/f:")) signals[name].scaling = parseFloat(attr.slice(3));
        if (attr.startsWith("/o:")) signals[name].offset = parseFloat(attr.slice(3));
        if (attr.startsWith("/min:")) signals[name].valueRange[0] = parseFloat(attr.slice(5));
        if (attr.startsWith("/max:")) signals[name].valueRange[1] = parseFloat(attr.slice(5));
        if (attr.startsWith("/u:")) signals[name].units = attr.slice(3).replace(/"/g, "");
        if (attr.startsWith("/e:")) {
          const en = attr.slice(3);
          if (enumerations[en]) {
            signals[name].valueDescriptions = { ...enumerations[en] };
          }
        }
      });
    }

    // inline description
    const desc = line.match(/\/\/\s*(.*)$/);
    if (desc) signals[name].description = desc[1].trim();
  }

  // Third Pass: build messages (merge by name)
  const msgMap = {};
  let current = null;

  for (let line of lines) {
    // header
    const hdr = line.match(/^\[(.+)\]$/);
    if (hdr) {
      const name = hdr[1].replace(/"/g, "");
      current = msgMap[name] || {
        name,
        id: null,
        dlc: null,
        sender: "Unknown",
        isExtendedId: false,
        signals: [],
        muxDefinitions: [],
      };
      msgMap[name] = current;
      if (!messages.includes(current)) messages.push(current);
      continue;
    }
    if (!current) continue;

    // ID
    const idm = line.match(/^ID=([0-9A-Fa-f]+)h(?:\s*\/\/\s*(.*))?$/);
    if (idm) {
      const raw = parseInt(idm[1], 16);
      current.id = `0x${raw.toString(16).toUpperCase()}`;
      if (idm[2]) current.comment = idm[2].trim();
      continue;
    }

    // Type
    const tm = line.match(/^Type=(Standard|Extended)$/);
    if (tm && current.id) {
      current.isExtendedId = tm[1] === "Extended";
      let raw = parseInt(current.id, 16);
      if (!current.isExtendedId) raw &= 0x7FF;
      current.id = current.isExtendedId
        ? `0x${raw.toString(16).toUpperCase().padStart(8, "0")}`
        : `0x${raw.toString(16).toUpperCase().padStart(3, "0")}`;
      continue;
    }

    // Len
    const lm = line.match(/^Len=(\d+)$/);
    if (lm) {
      current.dlc = parseInt(lm[1], 10);
      continue;
    }

    // Mux definitions (sets multiplexerValue on referenced signals)
    const muxm = line.match(/^Mux=(\w+)\s+(\d+),(\d+)\s+([0-9A-Fa-f]+)h(\s+-m)?/);
    if (muxm) {
      const [, mname, sb, ln, hv, big] = muxm;
      const val = parseInt(hv, 16);
      // mark the mux signal itself
      const muxSig = signals[mname];
      if (muxSig) muxSig.isMultiplexer = true;
      // assign multiplexerValue to all signals of this name
      current.muxDefinitions.push({
        name: mname,
        startBit: parseInt(sb, 10),
        length: parseInt(ln, 10),
        value: `0x${val.toString(16).toUpperCase().padStart(2, "0")}`,
        byteOrder: big ? "BigEndian" : "LittleEndian",
      });
      // also annotate the matching signal references when they’re later attached
      continue;
    }

    // Sig references
    const srm = line.match(/^Sig="?([^"\s]+)"?\s+(\d+)/);
    if (srm) {
      const nm = srm[1];
      const sb = parseInt(srm[2], 10);
      if (signals[nm]) {
        // if this signal name has multiple multiplexed definitions,
        // assign its current multiplexerValue based on the last Mux= for it
        const lastMux = current.muxDefinitions.find(m => m.name === nm);
        const sv = lastMux ? parseInt(lastMux.value, 16) : undefined;
        current.signals.push({ ...signals[nm], startBit: sb, multiplexerValue: sv });
      }
      continue;
    }
  }

  // Attach metadata, comments, descriptions here…
  // (omitted for brevity; unchanged from earlier)

  // --- NEW: group multiplexed signals just like parseDBC does ---
  messages.forEach(msg => {
    // find multiplexer field
    const muxField = msg.signals.find(s => s.isMultiplexer);
    if (!muxField) return;

    msg.multiplexer = muxField.name;

    // group by multiplexerValue
    const groups = {};
    msg.signals.forEach(s => {
      if (s.isMultiplexer) return;
      const key = String(s.multiplexerValue ?? 0);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    msg.multiplexedSignals = groups;

    // reorder signals: mux first, then groups in numeric order
    msg.signals = [
      muxField,
      ...Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .flatMap(k => groups[k])
    ];
  });

  // Keep any message with a valid ID
  const clean = messages.filter(m => m.id != null);

  return {
    formatVersion,
    title,
    messages: clean,
    nodes: Array.from(nodes),
  };
}