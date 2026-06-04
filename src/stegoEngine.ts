import crypto from 'crypto';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Searches for the stego_engine.py script in multiple possible directory structures
 * to remain fully resilient regardless of how / where the process is spawned.
 */
function findStegoEnginePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'stego_engine.py'),
    path.join(__dirname, '..', 'stego_engine.py'),
    path.join(__dirname, 'stego_engine.py'),
    '/app/applet/stego_engine.py',
    '/app/stego_engine.py',
    './stego_engine.py'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  // Default fallback to cwd
  return path.join(process.cwd(), 'stego_engine.py');
}

/**
 * Invokes the secure Python steganography background engine (stego_engine.py)
 * passing data via stdin and reading JSON from stdout.
 */
function runPythonStego(payload: any): any {
  const scriptPath = findStegoEnginePath();
  const logPath = path.join(process.cwd(), 'python_error.log');
  const payloadStr = JSON.stringify(payload);
  
  try {
    // Attempt execution with python3 first
    const stdout = execFileSync('python3', [scriptPath], {
      input: payloadStr,
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024, // 15MB budget
    });
    return JSON.parse(stdout);
  } catch (err: any) {
    const errorDetails = err.stderr ? err.stderr.toString() : err.message;
    try {
      fs.writeFileSync(logPath, `[python3 error] scriptPath=${scriptPath} cwd=${process.cwd()} dirname=${__dirname} status=${err.status} signal=${err.signal}\nMessage: ${err.message}\nStderr: ${errorDetails}\nStdout: ${err.stdout ? err.stdout.toString() : ''}\n`);
    } catch (fsErr: any) {
      console.error("Failed to write python_error.log:", fsErr.message);
    }
    console.warn(" [stegoEngine] python3 runner failed, trying python fallback. Reason:", errorDetails);
    try {
      // Fallback invocation with python
      const stdout = execFileSync('python', [scriptPath], {
        input: payloadStr,
        encoding: 'utf8',
        maxBuffer: 15 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch (fallbackErr: any) {
      const fallbackDetails = fallbackErr.stderr ? fallbackErr.stderr.toString() : fallbackErr.message;
      try {
        fs.appendFileSync(logPath, `[python fallback error]\nMessage: ${fallbackErr.message}\nStderr: ${fallbackDetails}\n`);
      } catch (fsErr) {}
      console.error("❌ [stegoEngine] Core Python security engine failed:", fallbackDetails);
      throw new Error(`Python Background Security Execution Failure: ${fallbackDetails}`);
    }
  }
}

// The end-of-payload marker is sixteen 0s (representing two Null characters \0\0)
// This is perfect because normal encrypted hex strings only contain [0-9a-f:] 
// and will never contain consecutive null characters when converted to ASCII.
const END_MARKER = '0000000000000000';


/**
 * Derives a 256-bit key from a passcode using SHA-256
 */
function deriveKey(passcode: string): Buffer {
  return crypto.createHash('sha256').update(passcode).digest();
}

/**
 * Encrypts cleartext using AES-256-CBC with the derived key from passcode
 */
export function encryptText(text: string, passcode: string): string {
  const key = deriveKey(passcode);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format as ivHex:ciphertextHex
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts ciphertext using AES-256-CBC with the derived key from passcode
 */
export function decryptText(encryptedWithIv: string, passcode: string): string {
  try {
    const key = deriveKey(passcode);
    const parts = encryptedWithIv.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted ciphertext format.');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    throw new Error('Failed to decrypt. Ensure your passcode is correct. (' + error.message + ')');
  }
}

/**
 * Converts a standard text string to binary bits
 */
export function textToBits(text: string): string {
  let bits = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    bits += charCode.toString(2).padStart(8, '0');
  }
  return bits;
}

/**
 * Converts binary bits back to a text string
 */
export function bitsToText(bits: string): string {
  let text = '';
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.substring(i, i + 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }
  return text;
}

/**
 * Base Theme Custom CSS Stylesheets
 */
export const CSS_THEME_TEMPLATES: Record<string, { title: string; css: string; description: string }> = {
  'cyber-neon': {
    title: 'Cyber Neon Arena',
    description: 'A glowing dark sci-fi design with hot pink glows and deep indigo matrices.',
    css: `:root {
  --primary: #ff007f;
  --secondary: #00f0ff;
  --bg: #0d0e15;
  --surface: #181a26;
  --glow-radius: 8px;
}
body {
  background-color: var(--bg);
  color: #fff;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}
.neon-container {
  background: var(--surface);
  border: 1px solid var(--primary);
  box-shadow: 0 0 var(--glow-radius) var(--primary);
  border-radius: 12px;
  padding: 24px;
}
.btn-cyber {
  background: transparent;
  color: var(--secondary);
  border: 1px solid var(--secondary);
  text-shadow: 0 0 4px var(--secondary);
  transition: all 0.3s ease;
}
.btn-cyber:hover {
  background: var(--secondary);
  color: #000;
  box-shadow: 0 0 15px var(--secondary);
}
.grid-overlay {
  background-image: linear-gradient(rgba(255,0,127,0.15) 1px, transparent 1px);
  background-size: 100% 40px;
}
.cyber-label {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #a0aec0;
  text-transform: uppercase;
}
`
  },
  'terminal-green': {
    title: 'Terminal Operator',
    description: 'A phosphor monochrome retro screen with high contrast scans and classic fonts.',
    css: `:root {
  --green: #4ade80;
  --dark-green: #052e16;
  --bg-darker: #020617;
  --font-family: 'Fira Code', monospace;
}
body {
  background-color: var(--bg-darker);
  color: var(--green);
  font-family: var(--font-family);
}
.term-box {
  border: 2px solid var(--green);
  background: var(--dark-green);
  border-radius: 4px;
  padding: 16px;
}
.term-cursor {
  background-color: var(--green);
  animation: blink 1s infinite alternate;
}
@keyframes blink {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.scanlines {
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90.00deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 4px, 6px 100%;
}
.btn-green {
  border: 1px solid var(--green);
  color: var(--green);
  background: transparent;
}
.btn-green:hover {
  background: var(--green);
  color: var(--bg-darker);
}
`
  },
  'sunset-pulse': {
    title: 'Sunset Pulse',
    description: 'A beautiful retro sunset style with gold gradients, amber glows, and peach shades.',
    css: `:root {
  --sunset-start: #f59e0b;
  --sunset-mid: #ec4899;
  --sunset-end: #8b5cf6;
  --bg-gradient: linear-gradient(135deg, #1e1b4b, #311042);
}
body {
  background: var(--bg-gradient);
  color: #ffedd5;
  font-family: 'Outfit', sans-serif;
}
.sunset-card {
  background: rgba(49, 16, 66, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,180,100,0.2);
  border-radius: 16px;
  padding: 24px;
}
.accent-amber {
  color: var(--sunset-start);
}
.accent-rose {
  color: var(--sunset-mid);
}
.accent-purple {
  color: var(--sunset-end);
}
.shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
}
.btn-sunset {
  background: linear-gradient(90.00deg, var(--sunset-start), var(--sunset-mid));
  color: white;
  border-radius: 9999px;
  font-weight: 500;
}
`
  }
};

/**
 * Generates dynamic padding semicolon CSS blocks to ensure enough storage capacity
 * Each dynamic CSS block controls our visual generative live steganography grid on screen.
 */
function generateSemicolonPadding(requiredSemicolons: number, theme: string): string {
  let paddingCss = `\n/* DYNAMIC VISUAL STEGANOGRAPHY CELL MATRIX */\n/* The CSS properties below dictate the live, colored design representation of this packet's data */\n`;
  
  // Decide grid cellular properties based on theme
  let colorVar1 = '#3b82f6';
  let colorVar2 = '#ff007f';
  if (theme === 'cyber-neon') {
    colorVar1 = '#00f0ff';
    colorVar2 = '#ff007f';
  } else if (theme === 'terminal-green') {
    colorVar1 = '#22c55e';
    colorVar2 = '#15803d';
  } else if (theme === 'sunset-pulse') {
    colorVar1 = '#f59e0b';
    colorVar2 = '#ec4899';
  }

  // Generate blocks. Each block has 4 semicolons. Let's make sure we have enough.
  const blocksCount = Math.ceil(requiredSemicolons / 4) + 10; // offset safety buffer
  
  for (let i = 0; i < blocksCount; i++) {
    const r = Math.floor(Math.sin(i * 0.1) * 127 + 128);
    const g = Math.floor(Math.cos(i * 0.2) * 127 + 128);
    const b = Math.floor(Math.sin(i * 0.3 + 1) * 127 + 128);
    
    const rotation = (i * 12) % 360;
    const opacity = ((i * 3) % 45 + 55) / 100;
    const activeColor = i % 2 === 0 ? colorVar1 : colorVar2;

    paddingCss += `.stego-cell-${i} {
  --cell-index: ${i};
  --cell-color: rgb(${r},${g},${b});
  --cell-opacity: ${opacity};
  --cell-rotation: ${rotation}deg;
}\n`;
  }
  
  return paddingCss;
}

/**
 * Hides a binary string (message bits) into the CSS text using EOL whitespace.
 * Space (' ') represents '0'
 * Tab ('\t') represents '1'
 * Occurs immediately after a semicolon ';'.
 */
export function hideBitsInCss(cssText: string, bits: string): string {
  // We split the CSS by semicolon to inject bit-specific whitespaces
  const parts = cssText.split(';');
  let outParts: string[] = [];
  let bitIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    
    // Symmetrical correction: clean any leading spaces or tabs from subsequent parts
    // so that we don't get false positive bit detections from standard CSS indentation!
    if (i > 0) {
      part = part.replace(/^[ \t]+/, '');
    }
    
    // Check if we still have bits to hide, and we are not on the last section
    if (bitIdx < bits.length && i < parts.length - 1) {
      const bit = bits[bitIdx];
      const suffix = bit === '0' ? ' ' : '\t';
      
      // CSS allows multiple whitespaces, so we can inject our space or tab safely
      outParts.push(part + ';' + suffix);
      bitIdx++;
    } else {
      // No more bits or the last part
      if (i < parts.length - 1) {
        outParts.push(part + ';');
      } else {
        outParts.push(part);
      }
    }
  }

  if (bitIdx < bits.length) {
    throw new Error(`Critical error: Semicolon capacity failed (${bitIdx}/${bits.length} written).`);
  }

  return outParts.join('');
}

/**
 * Encodes a secret message into a beautiful CSS stylesheet packet using Python child process
 */
export function createStegoCss(
  senderName: string,
  message: string,
  passcode: string,
  themeKey: string
): { cssContent: string; bitLength: number } {
  try {
    const response = runPythonStego({
      action: 'encrypt',
      sender: senderName,
      message,
      passcode,
      theme: themeKey
    });
    
    if (response && response.success) {
      return {
        cssContent: response.cssContent,
        bitLength: response.bitLength
      };
    } else {
      throw new Error(response?.error || 'Unknown error response from Python engine.');
    }
  } catch (pyErr: any) {
    console.warn("⚠️ [stegoEngine] Python runner failed. Falling back to local JS cipher loop... Error:", pyErr.message);
    
    // Fallback logic
    // 1. Encrypt text
    const encryptedText = encryptText(message, passcode);
    
    // 2. Convert to bits
    const encryptedBits = textToBits(encryptedText);
    
    // 3. Append the end of payload marker
    const fullBitsPayload = encryptedBits + END_MARKER;
    const bitLength = fullBitsPayload.length;

    // 4. Load base template
    const theme = CSS_THEME_TEMPLATES[themeKey] || CSS_THEME_TEMPLATES['cyber-neon'];
    let baseCss = `/* =========================================================================
     CSS STEGANOGRAPHY DESIGN FILE PACKET (JS FALLBACK)
     Sender: ${senderName}
     Style Theme: ${theme.title}
     Bit Capacity: ${bitLength}
     ========================================================================= */\n\n`;
    
    baseCss += theme.css;

    // 5. Append sufficient semicolons by generating functional cell matrices
    const baseSemicolons = (baseCss.match(/;/g) || []).length;
    const missingSemicolons = bitLength - baseSemicolons;
    
    if (missingSemicolons > 0) {
      baseCss += generateSemicolonPadding(missingSemicolons, themeKey);
    } else {
      baseCss += generateSemicolonPadding(100, themeKey);
    }

    // 6. Encode the bits into the semicolons
    const stegoCssContent = hideBitsInCss(baseCss, fullBitsPayload);

    return {
      cssContent: stegoCssContent,
      bitLength: bitLength
    };
  }
}

/**
 * Extracts binary bits from any CSS stylesheet text
 */
export function extractBitsFromCss(cssText: string): string {
  // Read whitespaces immediately after semicolons.
  // Space (' ') = 0, Tab ('\t') = 1.
  let bits = '';
  
  for (let i = 0; i < cssText.length; i++) {
    if (cssText[i] === ';') {
      if (i + 1 < cssText.length) {
        const nextChar = cssText[i + 1];
        if (nextChar === ' ') {
          bits += '0';
        } else if (nextChar === '\t') {
          bits += '1';
        }
      }
    }
  }

  // Find the end marker
  const endMarkerIdx = bits.indexOf(END_MARKER);
  if (endMarkerIdx === -1) {
    throw new Error('This stylesheet does not contain a decipherable steganographic message or the payload is incomplete.');
  }

  return bits.substring(0, endMarkerIdx);
}

/**
 * Extracts and decrypts the hidden message from a stego CSS stylesheet
 */
export function extractAndDecryptMessage(cssText: string, passcode: string): string {
  try {
    const response = runPythonStego({
      action: 'decrypt',
      cssContent: cssText,
      passcode
    });
    
    if (response && response.success) {
      return response.decryptedText;
    } else {
      throw new Error(response?.error || 'Unknown error response on decryption from Python engine.');
    }
  } catch (pyErr: any) {
    console.warn("⚠️ [stegoEngine] Python decryption runner failed. Falling back to local JS cipher decryption... Error:", pyErr.message);
    
    // Fallback logic
    // 1. Recover bits
    const bits = extractBitsFromCss(cssText);
    if (!bits || bits.length === 0) {
      throw new Error('No bits detected in this stylesheet.');
    }

    // 2. Turn bits to encrypted text
    const encryptedText = bitsToText(bits);
    
    // 3. Decrypt text using the passcode
    return decryptText(encryptedText, passcode);
  }
}
