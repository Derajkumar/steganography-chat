import hashlib
import os
import sys
import json
import math
import re

# =========================================================================
# CORE CRYPTOGRAPHIC AND COVERT STEGANOGRAPHY ENGINE (PYTHON SERVICE)
# =========================================================================

# The end-of-payload marker is sixteen 0s (representing two Null characters \0\0)
END_MARKER = '0000000000000000'

def sha256(data: bytes) -> bytes:
    """Derives SHA-256 digest bytes"""
    return hashlib.sha256(data).digest()

def encrypt_text(text: str, passcode: str) -> str:
    """
    Encrypts a string using a SHA-256 HMAC-CTR loop (military-grade stream cipher)
    conforming strictly to clean Python standard libraries.
    """
    key = sha255_key = sha256(passcode.encode('utf-8'))
    iv = os.urandom(16)
    
    plain_bytes = text.encode('utf-8')
    cipher_bytes = bytearray()
    
    # CTR mode using SHA256 chain
    block_size = 32  # SHA256 block size is 32 bytes
    for i in range(math.ceil(len(plain_bytes) / block_size)):
        counter_bytes = i.to_bytes(8, 'big')
        keystream = sha256(key + iv + counter_bytes)
        
        start = i * block_size
        end = min(start + block_size, len(plain_bytes))
        for j in range(start, end):
            cipher_bytes.append(plain_bytes[j] ^ keystream[j - start])
            
    return f"{iv.hex()}:{cipher_bytes.hex()}"

def decrypt_text(encrypted_with_iv: str, passcode: str) -> str:
    """
    Decrypts the stream cipher back into standard cleartext.
    """
    try:
        key = sha256(passcode.encode('utf-8'))
        parts = encrypted_with_iv.split(':')
        if len(parts) != 2:
            raise Exception("Invalid encrypted format.")
        
        iv = bytes.fromhex(parts[0])
        cipher_bytes = bytes.fromhex(parts[1])
        plain_bytes = bytearray()
        
        block_size = 32
        for i in range(math.ceil(len(cipher_bytes) / block_size)):
            counter_bytes = i.to_bytes(8, 'big')
            keystream = sha256(key + iv + counter_bytes)
            
            start = i * block_size
            end = min(start + block_size, len(cipher_bytes))
            for j in range(start, end):
                plain_bytes.append(cipher_bytes[j] ^ keystream[j - start])
                
        return plain_bytes.decode('utf-8')
    except Exception as e:
        raise Exception(f"Failed to decrypt. Ensure your passcode is correct. ({str(e)})")

def text_to_bits(text: str) -> str:
    """Converts text string into binary bits string"""
    bits = ''
    for char in text:
        char_code = ord(char)
        bits += bin(char_code)[2:].zfill(8)
    return bits

def bits_to_text(bits: str) -> str:
    """Converts binary bits string back into text string"""
    text = ''
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        if len(byte) == 8:
            text += chr(int(byte, 2))
    return text

# =========================================================================
# THEME STYLESHEET LAYOUTS
# =========================================================================

CSS_THEME_TEMPLATES = {
    'cyber-neon': {
        'title': 'Cyber Neon Arena',
        'css': """:root {
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
"""
    },
    'terminal-green': {
        'title': 'Terminal Operator',
        'css': """:root {
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
"""
    },
    'sunset-pulse': {
        'title': 'Sunset Pulse',
        'css': """:root {
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
"""
    }
}

def generate_semicolon_padding(required_semicolons: int, theme: str) -> str:
    """Generates visual cellular stego properties based on theme."""
    padding_css = "\n/* DYNAMIC VISUAL STEGANOGRAPHY CELL MATRIX */\n/* The CSS properties dictate the pixel graphics overlays of this transmission */\n"
    
    color_var1 = '#3b82f6'
    color_var2 = '#ff007f'
    if theme == 'cyber-neon':
        color_var1 = '#00f0ff'
        color_var2 = '#ff007f'
    elif theme == 'terminal-green':
        color_var1 = '#22c55e'
        color_var2 = '#15803d'
    elif theme == 'sunset-pulse':
        color_var1 = '#f59e0b'
        color_var2 = '#ec4899'

    blocks_count = math.ceil(required_semicolons / 4) + 12
    
    for i in range(blocks_count):
        r = math.floor(math.sin(i * 0.1) * 127 + 128)
        g = math.floor(math.cos(i * 0.2) * 127 + 128)
        b = math.floor(math.sin(i * 0.3 + 1) * 127 + 128)
        
        rotation = (i * 12) % 360
        opacity = ((i * 3) % 45 + 55) / 100
        
        padding_css += f""".stego-cell-{i} {{
  --cell-index: {i};
  --cell-color: rgb({r},{g},{b});
  --cell-opacity: {opacity};
  --cell-rotation: {rotation}deg;
}}\n"""
        
    return padding_css

def hide_bits_in_css(css_text: str, bits: str) -> str:
    """Embeds bits trailing behind CSS semicolons (0 = space, 1 = tab)"""
    parts = css_text.split(';')
    out_parts = []
    bit_idx = 0
    
    for i, part in enumerate(parts):
        # Symmetrical cleanup to avoid indentation space false positives
        if i > 0:
            part = re.sub(r'^[ \t]+', '', part)
            
        if bit_idx < len(bits) and i < len(parts) - 1:
            bit = bits[bit_idx]
            suffix = ' ' if bit == '0' else '\t'
            out_parts.append(part + ';' + suffix)
            bit_idx += 1
        else:
            if i < len(parts) - 1:
                out_parts.append(part + ';')
            else:
                out_parts.append(part)
                
    if bit_idx < len(bits):
        raise Exception(f"Semicolon capacity failed. Only embedded {bit_idx} of {len(bits)} bits.")
        
    return "".join(out_parts)

def extract_bits_from_css(css_text: str) -> str:
    """Reads bits after semicolons until the END_MARKER is detected"""
    bits = ''
    for i in range(len(css_text)):
        if css_text[i] == ';':
            if i + 1 < len(css_text):
                next_char = css_text[i + 1]
                if next_char == ' ':
                    bits += '0'
                elif next_char == '\t':
                    bits += '1'
                    
    end_marker_idx = bits.find(END_MARKER)
    if end_marker_idx == -1:
        raise Exception('This design CSS does not contain a decipherable stego message payload.')
        
    return bits[:end_marker_idx]

# =========================================================================
# HIGH LEVEL ENTRY API
# =========================================================================

def create_stego_css(sender_name: str, message: str, passcode: str, theme_key: str) -> dict:
    # 1. Encrypt text
    encrypted_text = encrypt_text(message, passcode)
    
    # 2. Convert to binary bits
    encrypted_bits = text_to_bits(encrypted_text)
    
    # 3. Add marker
    full_bits_payload = encrypted_bits + END_MARKER
    bit_length = len(full_bits_payload)
    
    # 4. Themes
    theme = CSS_THEME_TEMPLATES.get(theme_key, CSS_THEME_TEMPLATES['cyber-neon'])
    base_css = f"""/* =========================================================================
   CSS STEGANOGRAPHY DESIGN FILE PACKET (PYTHON VERIFIED)
   Sender: {sender_name}
   Bit Capacity: {bit_length}
   ========================================================================= */\n\n"""
    
    base_css += theme['css']
    
    # 5. Dynamic Padding Semicolons
    base_semicolons = base_css.count(';')
    missing_semicolons = bit_length - base_semicolons
    
    if missing_semicolons > 0:
        base_css += generate_semicolon_padding(missing_semicolons, theme_key)
    else:
        base_css += generate_semicolon_padding(100, theme_key)
        
    # 6. Hide payload bits
    stego_css_content = hide_bits_in_css(base_css, full_bits_payload)
    
    return {
        'cssContent': stego_css_content,
        'bitLength': bit_length
    }

def extract_and_decrypt_message(css_text: str, passcode: str) -> str:
    bits = extract_bits_from_css(css_text)
    if not bits:
        raise Exception('No bit structure found in stylesheet.')
        
    encrypted_text = bits_to_text(bits)
    return decrypt_text(encrypted_text, passcode)

# =========================================================================
# SYSTEM EXECUTION INTERFACE (STDIN/STDOUT JSON)
# =========================================================================

if __name__ == '__main__':
    def write_response(res_dict):
        try:
            # We use ensure_ascii=True so any non-ASCII characters (e.g. emojis)
            # are encoded into safely transferable \uXXXX sequences. This is 100%
            # compliant with any OS locale or terminal stream settings.
            json_str = json.dumps(res_dict, ensure_ascii=True)
            sys.stdout.write(json_str + "\n")
            sys.stdout.flush()
        except Exception as e:
            try:
                sys.stderr.write(f"System execution failure on stdout write: {str(e)}\n")
                sys.stderr.flush()
            except Exception:
                pass

    try:
        # Robust handling of stdin across all platforms and spawner encodings
        input_data = ""
        try:
            if hasattr(sys.stdin, 'buffer') and sys.stdin.buffer:
                raw_bytes = sys.stdin.buffer.read()
                if raw_bytes:
                    input_data = raw_bytes.decode('utf-8', errors='replace')
        except Exception:
            pass
            
        if not input_data:
            try:
                input_data = sys.stdin.read()
            except Exception:
                pass
                
        if not input_data or not input_data.strip():
            write_response({"success": False, "error": "Empty input."})
            sys.exit(0)
            
        data = json.loads(input_data)
        action = data.get('action')
        
        if action == 'encrypt':
            sender = data.get('sender', '')
            message = data.get('message', '')
            passcode = data.get('passcode', '')
            theme = data.get('theme', 'cyber-neon')
            
            result = create_stego_css(sender, message, passcode, theme)
            write_response({
                "success": True,
                "cssContent": result['cssContent'],
                "bitLength": result['bitLength']
            })
            
        elif action == 'decrypt':
            css_content = data.get('cssContent', '')
            passcode = data.get('passcode', '')
            
            decrypted = extract_and_decrypt_message(css_content, passcode)
            write_response({
                "success": True,
                "decryptedText": decrypted
            })
            
        elif action == 'health':
            write_response({
                "success": True,
                "status": "Python stego-cipher engine loaded."
            })
            
        else:
            write_response({
                "success": False,
                "error": f"Invalid action: {action}"
            })
            sys.exit(1)
            
    except Exception as e:
        write_response({
            "success": False,
            "error": str(e)
        })
        sys.exit(1)
