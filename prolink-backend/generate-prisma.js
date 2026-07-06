const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prismaPath = path.join(__dirname, 'node_modules/@prisma/client/generator');
const genPath = path.join(__dirname, 'node_modules/.prisma/client');

// Check if @prisma/internals exists and try to use it
try {
  // Try to generate using the dist files
  const files = fs.readdirSync(path.join(__dirname, 'node_modules/@prisma'));
  console.log('Prisma packages:', files);
  
  // Read the schema
  const schema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf-8');
  console.log('Schema loaded');
  
  // Create a basic .prisma/client directory with stub files
  const clientDir = path.join(__dirname, 'node_modules/.prisma/client');
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  // Copy needed files from @prisma/client
  const srcClientDir = path.join(__dirname, 'node_modules/@prisma/client');
  const files_to_copy = ['index.d.ts', 'index.js', 'runtime'];
  
  files_to_copy.forEach(file => {
    const src = path.join(srcClientDir, file);
    const dst = path.join(clientDir, file);
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        // Copy directory recursively
        const copyDir = (source, destination) => {
          if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
          }
          fs.readdirSync(source).forEach(file => {
            const sourceFile = path.join(source, file);
            const destFile = path.join(destination, file);
            if (fs.statSync(sourceFile).isDirectory()) {
              copyDir(sourceFile, destFile);
            } else {
              fs.copyFileSync(sourceFile, destFile);
            }
          });
        };
        copyDir(src, dst);
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  });
  
  console.log('Prisma client files prepared');
} catch (err) {
  console.error('Error preparing Prisma client:', err.message);
  process.exit(1);
}
