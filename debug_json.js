const fs = require('fs');

const files = [
  '/Users/domoblock/Documents/Proycts-dev/Habixa/apps/mobile/i18n/locales/es.json',
  '/Users/domoblock/Documents/Proycts-dev/Habixa/apps/mobile/i18n/locales/en.json'
];

files.forEach(file => {
  console.log(`Checking ${file}...`);
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
    console.log('Valid JSON.');
  } catch (e) {
    console.error(`Error in ${file}:`);
    console.error(e.message);
    
    // Attempt to find line number from error message if possible, or just print context
    // V8 error messages for JSON usually are like "Unexpected token } in JSON at position 1234"
    const match = e.message.match(/at position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const content = fs.readFileSync(file, 'utf8');
        
        // Find line number
        let line = 1;
        let col = 1;
        for (let i = 0; i < pos; i++) {
            if (content[i] === '\n') {
                line++;
                col = 1;
            } else {
                col++;
            }
        }
        
        console.log(`Error at Line ${line}, Column ${col}`);
        
        // Print snippet
        const lines = content.split('\n');
        const start = Math.max(0, line - 3);
        const end = Math.min(lines.length, line + 2);
        
        console.log('Context:');
        for (let i = start; i < end; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
            if (i === line - 1) {
                console.log(' '.repeat(col + (i+1).toString().length + 1) + '^');
            }
        }
    }
  }
  console.log('---');
});
