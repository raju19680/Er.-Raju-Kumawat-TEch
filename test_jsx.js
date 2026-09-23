const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('student-app/src/components/student-portal/student-dashboard.tsx', 'utf8');

const Parser = acorn.Parser.extend(jsx());
try {
  Parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 2024,
    plugins: { jsx: true }
  });
  console.log("Parsed successfully!");
} catch (e) {
  console.error("Parse error:", e.message);
  console.error("At line:", e.loc.line, "column:", e.loc.column);
}
