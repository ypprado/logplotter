/**
 * Parses the SYM file content into structured data matching parser-dbc output.
 * @param {string} content - The raw SYM file content.
 * @returns {{ messages: Array, nodes: Array }} - Parsed messages and nodes.
 */
export function parseSYM(content) {
  const lines = content.split('\n').map(l => l.trim());
  const messages = [];
  const nodes = new Set();
  const signalsDefs = {};
  const enumerations = {};

  // 1) Extract multi-line enums
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('Enum=')) continue;
    let accum = line;
    while (!accum.includes(')') && i < lines.length - 1) {
      i++;
      accum += ' ' + lines[i];
    }
    const m = accum.match(/^Enum=([^()]+)\(([^)]+)\)$/);
    if (!m) continue;
    const enumName = m[1].trim();
    const entries = m[2]
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map(p => p.trim())
      .filter(Boolean);
    const map = {};
    for (const p of entries) {
      const [k, v] = p.split('=').map(x => x.trim().replace(/^"|"$/g, ''));
      map[k] = v;
    }
    enumerations[enumName] = map;
  }

  // 2) Global signal definitions
  for (const line of lines) {
    const sigMatch = line.match(/^Sig="?([^"\s]+)"?\s+(\w+)\s+(\d+)(\s+-m)?/);
    if (!sigMatch) continue;
    const [, name, rawTypeRaw, lenRaw, muxFlag] = sigMatch;
    const rawType = rawTypeRaw.toLowerCase();
    const length = parseInt(lenRaw, 10);
    const isMux = !!muxFlag;
    const valueType =
      rawType === 'string'   ? 'String'   :
      rawType === 'unsigned' ? 'Unsigned' :
                               'Signed';

    signalsDefs[name] = {
      name,
      length,
      byteOrder:        isMux ? 'BigEndian' : 'LittleEndian',
      valueType,
      scaling:          1.0,
      offset:           0.0,
      valueRange:       [0, 1],
      units:            '',
      description:      '',
      valueDescriptions:{},
      defaultValue:     0,
      isMultiplexer:    isMux
    };

    const attrs = line.match(
      /\/[fo]:(-?\d+(\.\d+)?)|\/min:(-?\d+(\.\d+)?)|\/max:(-?\d+(\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g
    ) || [];
    for (const attr of attrs) {
      if (attr.startsWith('/f:')) signalsDefs[name].scaling = parseFloat(attr.slice(3));
      if (attr.startsWith('/o:')) signalsDefs[name].offset  = parseFloat(attr.slice(3));
      if (attr.startsWith('/min:')) signalsDefs[name].valueRange[0] = parseFloat(attr.slice(5));
      if (attr.startsWith('/max:')) signalsDefs[name].valueRange[1] = parseFloat(attr.slice(5));
      if (attr.startsWith('/u:')) signalsDefs[name].units   = attr.slice(3).replace(/"/g,'');
      if (attr.startsWith('/e:')) {
        const en = attr.slice(3);
        if (enumerations[en]) signalsDefs[name].valueDescriptions = { ...enumerations[en] };
      }
    }

    const desc = line.match(/\/\/\s*(.*)$/);
    if (desc) signalsDefs[name].description = desc[1].trim();
  }

  // 3) Build messages
  const msgMap = {};
  const muxValues = {};
  let current = null;

  for (const line of lines) {
    const hdr = line.match(/^\[(.+)\]$/);
    if (hdr) {
      const msgName = hdr[1].replace(/"/g, '');
      if (!msgMap[msgName]) {
        msgMap[msgName] = {
          id:            null,
          rawId:         null,
          isExtendedId:  false,
          name:          msgName,
          dlc:           null,
          sender:        'Unknown',
          comment:       undefined,
          signals:       []
        };
      }
      current = msgMap[msgName];
      if (!messages.includes(current)) messages.push(current);
      muxValues[msgName] = {};
      continue;
    }
    if (!current) continue;

    // ID=...h with optional comment
    const idm = line.match(/^ID=([0-9A-Fa-f]+)h(?:\s*\/\/\s*(.*))?$/);
    if (idm) {
      const raw = parseInt(idm[1], 16);
      current.rawId = raw;
      // default Standard: 11-bit mask, no padding
      const masked = raw & 0x7FF;
      current.id            = '0x' + masked.toString(16).toUpperCase();
      current.isExtendedId  = false;
      if (idm[2]) current.comment = idm[2].trim();
      continue;
    }

    const tm = line.match(/^Type=(Standard|Extended)$/);
    if (tm && current.rawId != null) {
      const isExt = tm[1] === 'Extended';
      current.isExtendedId = isExt;
      const mask   = isExt ? 0x1FFFFFFF : 0x7FF;
      const masked = current.rawId & mask;
      current.id = isExt
        ? '0x' + masked.toString(16).toUpperCase().padStart(8, '0')
        : '0x' + masked.toString(16).toUpperCase();
      continue;
    }

    const lm = line.match(/^Len=(\d+)$/);
    if (lm) {
      current.dlc = parseInt(lm[1], 10);
      continue;
    }

    // record Mux= values for later
    const muxm = line.match(/^Mux=(\w+)\s+\d+,\d+\s+([0-9A-Fa-f]+)h/);
    if (muxm) {
      const [, mname, hv] = muxm;
      muxValues[current.name][mname] = parseInt(hv, 16);
      continue;
    }

    const vrm = line.match(/^Var=([^ ]+)\s+(\w+)\s+(\d+),(\d+)(.*)$/);
    if (vrm) {
      const [, vname, rawTypeRaw, sb, ln, rest] = vrm;
      const startBit = parseInt(sb, 10);
      const length   = parseInt(ln, 10);
      const rt       = rawTypeRaw.toLowerCase();
      const valueType =
        rt === 'string'   ? 'String'   :
        rt === 'unsigned' ? 'Unsigned' :
                            'Signed';

      const sig = {
        name:             vname,
        startBit,
        length,
        byteOrder:        'LittleEndian',
        valueType,
        scaling:          1.0,
        offset:           0.0,
        valueRange:       [0, 1],
        units:            '',
        description:      '',
        valueDescriptions:{},
        defaultValue:     0,
        isMultiplexer:    false,
        multiplexerValue: muxValues[current.name]?.[vname]
      };
      const attrs2 = rest.match(
        /\/[fo]:(-?\d+(\.\d+)?)|\/min:(-?\d+(\.\d+)?)|\/max:(-?\d+(\.\d+)?)|\/u:"([^"]+)"|\/e:([^\s]+)/g
      ) || [];
      for (const attr of attrs2) {
        if (attr.startsWith('/f:')) sig.scaling = parseFloat(attr.slice(3));
        if (attr.startsWith('/o:')) sig.offset  = parseFloat(attr.slice(3));
        if (attr.startsWith('/min:')) sig.valueRange[0] = parseFloat(attr.slice(5));
        if (attr.startsWith('/max:')) sig.valueRange[1] = parseFloat(attr.slice(5));
        if (attr.startsWith('/u:')) sig.units = attr.slice(3).replace(/"/g,'');
        if (attr.startsWith('/e:')) {
          const en = attr.slice(3);
          if (enumerations[en]) sig.valueDescriptions = { ...enumerations[en] };
        }
      }
      current.signals.push(sig);
      continue;
    }

    const srm = line.match(/^Sig="?([^"\s]+)"?\s+(\d+)$/);
    if (srm) {
      const [, nm, sbRaw] = srm;
      const sb = parseInt(sbRaw, 10);
      const def = signalsDefs[nm];
      if (def) {
        const mv = muxValues[current.name]?.[nm];
        current.signals.push({
          name:              def.name,
          startBit:          sb,
          length:            def.length,
          byteOrder:         def.byteOrder,
          valueType:         def.valueType,
          scaling:           def.scaling,
          offset:            def.offset,
          valueRange:        [...def.valueRange],
          units:             def.units,
          description:       def.description,
          valueDescriptions: { ...def.valueDescriptions },
          defaultValue:      def.defaultValue,
          multiplexerValue:  mv
        });
      }
      continue;
    }
  }

  // 4) Filter & sort
  const clean = messages.filter(m => m.id != null);
  clean.sort((a, b) => parseInt(a.id, 16) - parseInt(b.id, 16));

  return { messages: clean, nodes: Array.from(nodes) };
}