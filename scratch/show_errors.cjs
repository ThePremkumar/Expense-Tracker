const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('lint_output.json', 'utf8'));

let output = '';
const errorFiles = data.filter(f => f.errorCount > 0 || f.warningCount > 0);
errorFiles.forEach(file => {
  output += `\nFile: ${path.relative(process.cwd(), file.filePath)}\n`;
  file.messages.forEach(e => {
    if (e.severity > 0) {
      output += `  [${e.severity === 2 ? 'ERROR' : 'WARN'}] Line ${e.line}:${e.column} - ${e.message} (${e.ruleId})\n`;
    }
  });
});
output += `\nTotal files checked: ${data.length}\n`;
output += `Total errors: ${data.reduce((acc, f) => acc + f.messages.filter(m => m.severity === 2).length, 0)}\n`;
output += `Total warnings: ${data.reduce((acc, f) => acc + f.messages.filter(m => m.severity === 1).length, 0)}\n`;

fs.writeFileSync('scratch/lint_results.utf8.txt', output, 'utf8');
