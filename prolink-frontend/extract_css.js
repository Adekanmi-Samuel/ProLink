const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\02dee024-6b5d-4129-ba1f-52aa5b579993\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1038) {
      const data = JSON.parse(line);
      const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
      
      const startIdx = content.indexOf("/* ═════════════════════════════════════════════════");
      const endIdx = content.indexOf("PART 2 —");

      if (startIdx !== -1 && endIdx !== -1) {
        let cssChunk = content.substring(startIdx, endIdx);
        // Clean up the end which might contain the exact line "================================================================"
        const lastEquals = cssChunk.lastIndexOf("================================================================");
        if (lastEquals !== -1) {
          cssChunk = cssChunk.substring(0, lastEquals).trim();
        }
        
        fs.appendFileSync('c:\\ProLink\\prolink-frontend\\src\\app\\globals.css', '\n\n' + cssChunk + '\n');
        console.log("Appended CSS successfully.");
      } else {
        console.log("Could not find markers. startIdx: " + startIdx + ", endIdx: " + endIdx);
        // write to debug file
        fs.writeFileSync('c:\\ProLink\\prolink-frontend\\debug_content.txt', content);
      }
      break;
    }
  }
}

extract();
