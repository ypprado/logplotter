/**
 * Parses the SYM file content into structured data matching parser expectations.
 * @param {string} content - The raw SYM file content.
 * @returns {{ messages: Array, nodes: Array }} - Parsed messages and nodes.
 */
export function parseSYM(content) {
  const lines = content.split("\n").map(l => l.trim());
  const messages = [];
  const nodes = new Set();
  const signalsDefs = {};
  const enumerations = {};

  // 1) Extract multi-line enums
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("Enum=")) continue;
    let accum = lines[i];
    while (!accum.includes(")")) {
      i++;
      if (i >= lines.length) break;
      accum += " " + lines[i];
    }
    const m = accum.match(/^Enum=([^()]+)\(([\s\S]+)\)$/);
    if (!m) continue;
    const name = m[1].trim();
    const entries = m[2]
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(p => p.trim())
      .filter(Boolean);
    const map = {};
    entries.forEach(p => {
      const [k, v] = p.split("=").map(x => x.trim().replace(/^"|"$/g, ""));
      map[k] = v;
    });
    enumerations[name] = map;
  }

  // 2) Global signal definitions (Sig= lines anywhere)
  for (const line of lines) {
    const sigMatch = line.match(/^Sig="?([^"]+)"?\s+(\w+)\s+(\d+)(\s+-m)?/);
    if (!sigMatch) continue;

    const [ , name, rawTypeRaw, lenRaw, muxFlag ] = sigMatch;
    const rawType = rawTypeRaw.toLowerCase();
    const length  = parseInt(lenRaw, 10);
    const isBig   = !!muxFlag;

    const valueType =
      rawType === "string"   ? "String"   :
      rawType === "unsigned" ? "Unsigned" : "Signed";

    signalsDefs[name] = {
      name,
      length,
      byteOrder:        isBig ? "BigEndian" : "LittleEndian",
      valueType,
      scaling:          1.0,
      offset:           0.0,
      valueRange:       [0, 1],
      units:            "",
      description:      "",
      valueDescriptions:{},
      defaultValue:     0,
      isMultiplexer:    isBig
    };

    // parse attributes: /f:, /o:, /min:, /max:, /u:, /e:
    const attrs = line.match(
      /\/[fo]:(-?\d+(\.\d+)?)|\/min:(-?\d+(\.\d+)?)|\/max:(-?\d+(\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g
    ) || [];
    attrs.forEach(attr => {
      if (attr.startsWith("/f:")) {
        signalsDefs[name].scaling = parseFloat(attr.slice(3));
      }
      if (attr.startsWith("/o:")) {
        signalsDefs[name].offset = parseFloat(attr.slice(3));
      }
      if (attr.startsWith("/min:")) {
        signalsDefs[name].valueRange[0] = parseFloat(attr.slice(5));
      }
      if (attr.startsWith("/max:")) {
        signalsDefs[name].valueRange[1] = parseFloat(attr.slice(5));
      }
      if (attr.startsWith("/u:")) {
        signalsDefs[name].units = attr.slice(3).replace(/"/g, "");
      }
      if (attr.startsWith("/e:")) {
        const en = attr.slice(3);
        if (enumerations[en]) {
          signalsDefs[name].valueDescriptions = {
            ...enumerations[en]
          };
        }
      }
    });

    // inline description after //
    const desc = line.match(/\/\/\s*(.*)$/);
    if (desc) {
      signalsDefs[name].description = desc[1].trim();
    }
  }

  // 3) Third pass: build messages, merge repeated blocks
  const msgMap = {};
  const muxValues = {}; // per-message map of { signalName: numericValue }
  let current = null;

  for (const line of lines) {
    // [MessageName]
    const hdr = line.match(/^\[(.+)\]$/);
    if (hdr) {
      const name = hdr[1].replace(/"/g, "");
      if (!msgMap[name]) {
        msgMap[name] = {
          name,
          id:             null,
          rawId:          null,
          isExtendedId:   false,
          dlc:            null,
          sender:         "Unknown",
          comment:        undefined,
          signals:        [],
          muxDefinitions: []
        };
      }
      current = msgMap[name];
      if (!messages.includes(current)) messages.push(current);
      muxValues[name] = {};
      continue;
    }
    if (!current) continue;

    // ID=123h // optional comment
    const idm = line.match(/^ID=([0-9A-Fa-f]+)h(?:\s*\/\/\s*(.*))?$/);
    if (idm) {
      const raw = parseInt(idm[1], 16);
      current.rawId = raw;
      // default to standard (11-bit) mask
      const masked = raw & 0x7FF;
      current.id = "0x" + masked.toString(16).toUpperCase();
      current.isExtendedId = false;
      if (idm[2]) {
        current.comment = idm[2].trim();
      }
      continue;
    }

    // Type=Standard|Extended
    const tm = line.match(/^Type=(Standard|Extended)$/);
    if (tm && current.rawId !== null) {
      const isExt = tm[1] === "Extended";
      current.isExtendedId = isExt;
      const mask = isExt ? 0x1FFFFFFF : 0x7FF;
      const masked = current.rawId & mask;
      if (isExt) {
        // extended → pad to 8 hex digits
        current.id = "0x" + masked.toString(16).toUpperCase().padStart(8, "0");
      } else {
        // standard → no zero-padding
        current.id = "0x" + masked.toString(16).toUpperCase();
      }
      continue;
    }

    // Len=#
    const lm = line.match(/^Len=(\d+)$/);
    if (lm) {
      current.dlc = parseInt(lm[1], 10);
      continue;
    }

    // Mux=Name start,length hexh [-m]
    const muxm = line.match(
      /^Mux=(\w+)\s+(\d+),(\d+)\s+([0-9A-Fa-f]+)h(\s+-m)?$/
    );
    if (muxm) {
      const [, mname, sb, ln, hv, bigFlag] = muxm;
      const big = !!bigFlag;
      const rawVal = parseInt(hv, 16);
      const hexVal = "0x" +
        rawVal.toString(16).toUpperCase().padStart(2, "0");

      // record for later Sig/Var
      muxValues[current.name][mname] = rawVal;

      // push into muxDefinitions
      current.muxDefinitions.push({
        name:     mname,
        startBit: parseInt(sb, 10),
        length:   parseInt(ln, 10),
        value:    hexVal,
        byteOrder: big ? "BigEndian" : "LittleEndian"
      });
      continue;
    }

    // Var=Name type start,length [attrs]
    const vrm = line.match(/^Var=([^ ]+)\s+(\w+)\s+(\d+),(\d+)(.*)$/);
    if (vrm) {
      const [, vname, rawTypeRaw, sb, ln, rest] = vrm;
      const startBit = parseInt(sb, 10);
      const length   = parseInt(ln, 10);
      const rt       = rawTypeRaw.toLowerCase();
      const valueType =
        rt === "string"   ? "String"   :
        rt === "unsigned" ? "Unsigned" : "Signed";

      const sig = {
        name:             vname,
        startBit,
        length,
        byteOrder:        "LittleEndian",
        valueType,
        scaling:          1.0,
        offset:           0.0,
        valueRange:       [0, 1],
        units:            "",
        description:      "",
        valueDescriptions:{},
        defaultValue:     0,
        isMultiplexer:    false,
        multiplexerValue: muxValues[current.name]?.[vname]
      };

      // same attr parsing as global Sig
      const attrs2 = (rest.match(
        /\/[fo]:(-?\d+(\.\d+)?)|\/min:(-?\d+(\.\d+)?)|\/max:(-?\d+(\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g
      ) || []);
      attrs2.forEach(attr => {
        if (attr.startsWith("/f:")) {
          sig.scaling = parseFloat(attr.slice(3));
        }
        if (attr.startsWith("/o:")) {
          sig.offset = parseFloat(attr.slice(3));
        }
        if (attr.startsWith("/min:")) {
          sig.valueRange[0] = parseFloat(attr.slice(5));
        }
        if (attr.startsWith("/max:")) {
          sig.valueRange[1] = parseFloat(attr.slice(5));
        }
        if (attr.startsWith("/u:")) {
          sig.units = attr.slice(3).replace(/"/g, "");
        }
        if (attr.startsWith("/e:")) {
          const en = attr.slice(3);
          if (enumerations[en]) {
            sig.valueDescriptions = { ...enumerations[en] };
          }
        }
      });

      current.signals.push(sig);
      continue;
    }

    // Sig="Name" bitPosition
    const srm = line.match(/^Sig="?([^"\s]+)"?\s+(\d+)/);
    if (srm) {
      const [, nm, sbRaw] = srm;
      const sb = parseInt(sbRaw, 10);
      const def = signalsDefs[nm];
      if (def) {
        const mv = muxValues[current.name]?.[nm];
        current.signals.push({
          name:             def.name,
          startBit:         sb,
          length:           def.length,
          byteOrder:        def.byteOrder,
          valueType:        def.valueType,
          scaling:          def.scaling,
          offset:           def.offset,
          valueRange:       [...def.valueRange],
          units:            def.units,
          defaultValue:     def.defaultValue,
          multiplexerValue: mv,
          valueDescriptions:{ ...def.valueDescriptions },
          description:      def.description,
          isMultiplexer:    def.isMultiplexer
        });
      }
      continue;
    }

    // (You can parse TxNode= here if your SYM uses it to populate sender & nodes)
  }

  // 4) Filter out any message without a valid ID
  const clean = messages.filter(m => m.id != null);

  // 5) Optionally sort by numeric ID
  clean.sort((a, b) => parseInt(a.id, 16) - parseInt(b.id, 16));

  return {
    messages: clean,
    nodes:    Array.from(nodes)
  };
}
