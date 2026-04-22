const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('lint_output.json', 'utf8'));

data.forEach(file => {
  const errors = file.messages.filter(m => m.severity === 2);
  if (errors.length > 0) {
    console.log(`File: ${path.relative(process.cwd(), file.filePath)}`);
    errors.forEach(e => {
      console.log(`  Line ${e.line}:${e.column} - ${e.message} (${e.ruleId})`);
    });
  }
});
