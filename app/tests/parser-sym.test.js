import { parseSYM } from '../scripts/parser-sym.js';

describe('parseSYM', () => {

    test('parses different IDs combinations', () => {
        const content = `
            [Msg_1]
            ID=100h
            Type=Standard

            [Msg_2]
            ID=200h
            Type=Extended
            
            [Msg_3]
            ID=18ABCDEFh
            Type=Standard

            [Msg_4]
            ID=18AABBCCh
            Type=Extended
            Len=8
        `;
        
        const parsedData = parseSYM(content);

        expect(parsedData.messages).toHaveLength(4);

        const msg1 = parsedData.messages[0];
        expect(msg1.id).toBe('0x100');
        expect(msg1.name).toBe('Msg_1');
        expect(msg1.isExtendedId).toBe(false);

        const msg2 = parsedData.messages[1];
        expect(msg2.id).toBe('0x00000200');
        expect(msg2.name).toBe('Msg_2');
        expect(msg2.isExtendedId).toBe(true);

        const msg3 = parsedData.messages[2];
        expect(msg3.id).toBe('0x5EF');
        expect(msg3.name).toBe('Msg_3');
        expect(msg3.isExtendedId).toBe(false);

        const msg4 = parsedData.messages[3];
        expect(msg4.id).toBe('0x18AABBCC');
        expect(msg4.name).toBe('Msg_4');
        expect(msg4.isExtendedId).toBe(true);
    });


test('parses a minimal SYM content with one message and one signal', () => {
    const content = `
      [EngineMsg]
      ID=123h
      Type=Standard
      Len=8
      Sig="EngineSpeed" 0
      Sig="EngineSpeed" unsigned 2
    `;
    
    const parsedData = parseSYM(content);
    
    expect(parsedData.messages).toHaveLength(1);
    const msg = parsedData.messages[0];
    expect(msg.id).toBe('0x123');
    expect(msg.name).toBe('EngineMsg');
    expect(msg.dlc).toBe(8);
    expect(msg.sender).toBe('Unknown');
    expect(msg.isExtendedId).toBe(false);
    expect(msg.signals).toHaveLength(1);

    const sig = msg.signals[0];
    expect(sig.name).toBe('EngineSpeed');
    expect(sig.startBit).toBe(0);
    expect(sig.length).toBe(2);
    expect(sig.byteOrder).toBe('LittleEndian');
    expect(sig.valueType).toBe('Unsigned');
    expect(sig.scaling).toBe(1.0);
    expect(sig.offset).toBe(0.0);
    expect(sig.units).toBe('');
    expect(sig.valueRange).toEqual([0, 1]);
    expect(sig.valueDescriptions).toEqual({});
    
    // No nodes were found
    expect(parsedData.nodes).toEqual([]);
  });

test('handles enumerations and assigns them correctly to signals', () => {
    const content = `
      Enum=GearEnum("0"=Park,"1"=Reverse,"2"=Neutral,"3"=Drive)
      [TransmissionMsg]
      ID=200h
      Type=Standard
      Len=8
      Sig="GearPosition" 16
      Sig="GearPosition" unsigned 8 /e:GearEnum
    `;
    
    const parsedData = parseSYM(content);
    expect(parsedData.messages).toHaveLength(1);

    const msg = parsedData.messages[0];
    expect(msg.name).toBe('TransmissionMsg');
    expect(msg.id).toBe('0x200'); // 200 in decimal is 0xC8
    expect(msg.signals).toHaveLength(1);

    const gearSig = msg.signals[0];
    expect(gearSig.name).toBe('GearPosition');
    expect(gearSig.valueDescriptions).toMatchObject({
      '0': 'Park',
      '1': 'Reverse',
      '2': 'Neutral',
      '3': 'Drive',
    });
    expect(gearSig.startBit).toBe(16);
    expect(gearSig.length).toBe(8);
  });

  it('parses big-endian signals correctly', () => {
    const content = `
      Sig="BigSignal" unsigned 16 -m
      [TestMsg]
      ID=123h
      Type=Standard
      Len=4
      Sig="BigSignal" 0
    `;
    
    const parsedData = parseSYM(content);
    expect(parsedData.messages).toHaveLength(1);

    const msg = parsedData.messages[0];
    expect(msg.signals).toHaveLength(1);

    const bigSig = msg.signals[0];
    expect(bigSig.name).toBe('BigSignal');
    expect(bigSig.byteOrder).toBe('BigEndian');
    expect(bigSig.length).toBe(16);
  });

test('parses scaling, offset, min, max, and units', () => {
    const content = `
      Sig="ScaledSignal" unsigned 8 /f:0.5 /o:-10 /min:-100 /max:100 /u:"degC"
      [TestMsg]
      ID=7FFh
      Len=1
      Sig="ScaledSignal" 0
    `;
    
    const parsedData = parseSYM(content);
    expect(parsedData.messages).toHaveLength(1);

    const msg = parsedData.messages[0];
    const scaledSig = msg.signals.find(s => s.name === 'ScaledSignal');
    expect(scaledSig).toBeDefined();
    expect(scaledSig.scaling).toBe(0.5);
    expect(scaledSig.offset).toBe(-10);
    expect(scaledSig.valueRange).toEqual([-100, 100]);
    expect(scaledSig.units).toBe('degC');
  });

test('gracefully handles no messages or signals', () => {
    const content = `Enum=EmptyEnum("0"=None)`;
    const parsedData = parseSYM(content);

    expect(parsedData.messages).toHaveLength(0);
    expect(parsedData.nodes).toHaveLength(0);
  });

test('parses multiple messages and checks node creation if applicable', () => {
    // If your SYM doesn't explicitly define nodes, you might not get them. 
    // Suppose we have some lines referencing nodes
    const content = `
      [EngineMsg]
      ID=100h
      Type=Standard
      Len=8
      Sig="Speed" 0
      Sig="Speed" unsigned 8

      [BrakeMsg]
      ID=101h
      Type=Standard
      Len=8
      Sig="Pressure" 8
      Sig="Pressure" unsigned 8
    `;
    
    const parsedData = parseSYM(content);

    expect(parsedData.messages).toHaveLength(2);
    expect(parsedData.nodes).toHaveLength(0); 
    // Because we haven't assigned node/sender info in SYM, 
    // parseSYM doesn’t populate them by default
  });

  test('handles missing fields gracefully', () => {
      const content = `
        [IncompleteMsg]
        ID=
        Type=
      `;
      const parsedData = parseSYM(content);
      expect(parsedData.messages).toHaveLength(0);
  });

  test('rejects invalid ID formats', () => {
      const content = `
        [InvalidMsg]
        ID=XYZh
        Type=Standard
      `;
      expect(() => parseSYM(content)).toThrow("Invalid ID format");
  });

  test('parses case-insensitive Type and ID keys', () => {
      const content = `
        [CaseInsensitiveMsg]
        id=123h
        type=extended
      `;
      const parsedData = parseSYM(content);
      expect(parsedData.messages).toHaveLength(1);
      expect(parsedData.messages[0].id).toBe('0x123');
      expect(parsedData.messages[0].isExtendedId).toBe(true);
  });

  test('handles duplicate message names correctly', () => {
      const content = `
        [DuplicateMsg]
        ID=200h
        Type=Standard

        [DuplicateMsg]
        ID=200h
        Type=Standard
      `;
      const parsedData = parseSYM(content);
      expect(parsedData.messages).toHaveLength(1);
  });

  test('rejects signals with excessive bit length', () => {
      const content = `
        [TestMsg]
        ID=300h
        Type=Standard
        Sig="BigSignal" unsigned 80
      `;
      expect(() => parseSYM(content)).toThrow("Bit length exceeds valid range");
  });

  test('handles empty or comment-only files gracefully', () => {
      const content = `
        // This is a comment
        # Another comment
      `;
      const parsedData = parseSYM(content);
      expect(parsedData.messages).toHaveLength(0);
  });

  test('parses message names with special characters', () => {
      const content = `
        [Msg_with-Special_Chars]
        ID=101h
        Type=Standard
      `;
      const parsedData = parseSYM(content);
      expect(parsedData.messages[0].name).toBe('Msg_with-Special_Chars');
  });

  test('applies default values to missing signal properties', () => {
      const content = `
        [TestMsg]
        ID=101h
        Type=Standard
        Sig="IncompleteSignal"
      `;
      const parsedData = parseSYM(content);
      const sig = parsedData.messages[0].signals[0];

      expect(sig.length).toBeDefined();
      expect(sig.scaling).toBe(1.0);
      expect(sig.units).toBe('');
  });

});