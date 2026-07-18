const fs = require('fs');

const content = fs.readFileSync('src/server/db/schema.ts', 'utf8');

// The file currently looks like:
// [CATEGORIES]
// [ORGANIZATIONS]
// [ADS]
// [MISCELLANEOUS]
// import { pgTable...
// [ENUMS]
// [AUTH & USERS]

const lines = content.split('\n');

const enumStartIndex = lines.findIndex(l => l.includes('// ENUMS'));
if (enumStartIndex === -1) {
    console.log("Could not find ENUMS block");
    process.exit(1);
}

// Find the import statements which are just above ENUMS
let importStartIndex = enumStartIndex;
while (importStartIndex > 0 && !lines[importStartIndex - 1].startsWith('import')) {
    importStartIndex--;
}
// Include the imports
while (importStartIndex > 0 && lines[importStartIndex - 1].startsWith('import')) {
    importStartIndex--;
}

const bottomPart = lines.slice(importStartIndex);
const topPart = lines.slice(0, importStartIndex);

// Clean up any extra "import { pgTable..." scattered in topPart
const cleanTopPart = topPart.filter(l => !l.startsWith('import { pgTable') && !l.startsWith('import { relations'));

const finalContent = bottomPart.join('\n') + '\n\n' + cleanTopPart.join('\n');

fs.writeFileSync('src/server/db/schema.ts', finalContent);
console.log("Successfully reordered schema.ts");
