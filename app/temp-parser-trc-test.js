import { parseTRC } from './scripts/parser-trc.js';
(async () => {
  const file = { text: async () => ';$FILEVERSION=1.0\nM1 2000 1234 3 0A 0B 0C\n' };
  const result = await parseTRC(file);
  console.log(JSON.stringify(result, null, 2));
})();
