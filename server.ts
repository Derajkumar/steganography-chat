import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createStegoCss, extractAndDecryptMessage } from './src/stegoEngine';
import { ChatPacket, Contact, ChatRoom } from './src/types';

const app = express();
const PORT = 3000;

// Enable JSON routing and request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server In-Memory Database Arrays
const chat_db: ChatPacket[] = [];
const contacts_db: Contact[] = [];
const rooms_db: ChatRoom[] = [];

// Dictionary holding ID to passcode mapping for secure server-side decryption
const passcode_store = new Map<string, string>();

// Helper to seed messages, contacts, and rooms on startup
function seedDatabase() {
  try {
    // 1. Seed Contacts
    const aliceContact: Contact = {
      id: 'alice',
      name: '🕵️‍♀️ Agent Alice',
      phone: '+1 (555) 777-0101',
      email: 'alice@covert.net',
      status: 'Writing stego guidelines...',
      customPasscode: 'sunset77'
    };
    const bobContact: Contact = {
      id: 'bob',
      name: '🧑‍💻 Specialist Bob',
      phone: '+1 (555) 909-1212',
      email: 'bob@cipher.io',
      status: 'Compiling semicolon matrices.',
      customPasscode: 'stego123'
    };
    const chiefContact: Contact = {
      id: 'chief',
      name: '🕶️ Chief Operator',
      phone: '+1 (555) 100-2020',
      email: 'chief@hq.gov',
      status: 'System overlay is integral.',
      customPasscode: 'hqkey'
    };

    contacts_db.push(aliceContact, bobContact, chiefContact);

    // 2. Seed Rooms
    const groupRoom: ChatRoom = {
      id: 'group-covert',
      name: '⚡ COVERT DIRECTIVES (GROUP)',
      isGroup: true,
      memberIds: ['alice', 'bob']
    };
    const aliceRoom: ChatRoom = {
      id: 'room-alice',
      name: '🕵️‍♀️ Agent Alice',
      isGroup: false,
      memberIds: ['alice']
    };
    const bobRoom: ChatRoom = {
      id: 'room-bob',
      name: '🧑‍💻 Specialist Bob',
      isGroup: false,
      memberIds: ['bob']
    };
    const chiefRoom: ChatRoom = {
      id: 'room-chief',
      name: '🕶️ Chief Operator',
      isGroup: false,
      memberIds: ['chief']
    };

    rooms_db.push(groupRoom, aliceRoom, bobRoom, chiefRoom);

    // 3. Seed Stego messages inside rooms
    // Welcome message in group directives
    const welcomeId = '1000000001';
    const welcomeResult = createStegoCss(
      '🔒 Security Bot',
      'Welcome to the Covert CSS Steganography chat! This secret greeting is fully encrypted and hidden trail-wise behind semicolons in this very stylesheet. Use code "stego123" to decrypt!',
      'stego123',
      'cyber-neon'
    );
    
    const welcomePacket: ChatPacket = {
      id: welcomeId,
      roomId: 'group-covert',
      sender: '🔒 Security Bot',
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(),
      filename: `packet_${welcomeId}.css`,
      coverStyle: 'cyber-neon',
      cssContent: welcomeResult.cssContent,
      cssUrl: `/css/packet_${welcomeId}.css`,
      bitLength: welcomeResult.bitLength,
      hint: 'Session passcode: "stego123"'
    };
    chat_db.push(welcomePacket);
    passcode_store.set(welcomeId, 'stego123');

    // Alice stego packet inside room-alice
    const aliceId = '1000000002';
    const aliceResult = createStegoCss(
      '🕵️‍♀️ Agent Alice',
      'Operation Whisper is a go. Semicolon-space overlays are compiled. Do not use unencrypted channels. Decrypt with "sunset77".',
      'sunset77',
      'sunset-pulse'
    );
    const alicePacket: ChatPacket = {
      id: aliceId,
      roomId: 'room-alice',
      sender: '🕵️‍♀️ Agent Alice',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
      filename: `packet_${aliceId}.css`,
      coverStyle: 'sunset-pulse',
      cssContent: aliceResult.cssContent,
      cssUrl: `/css/packet_${aliceId}.css`,
      bitLength: aliceResult.bitLength,
      hint: 'Requires password: "sunset77"'
    };
    chat_db.push(alicePacket);
    passcode_store.set(aliceId, 'sunset77');

    // Bob stego packet inside room-bob
    const bobId = '1000000003';
    const bobResult = createStegoCss(
      '🧑‍💻 Specialist Bob',
      'I compiled the semicolon bits matrix. Safe key synchronizer is active. Decrypt with passcode "stego123". Let me know if you received the shipment.',
      'stego123',
      'terminal-green'
    );
    const bobPacket: ChatPacket = {
      id: bobId,
      roomId: 'room-bob',
      sender: '🧑‍💻 Specialist Bob',
      timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
      filename: `packet_${bobId}.css`,
      coverStyle: 'terminal-green',
      cssContent: bobResult.cssContent,
      cssUrl: `/css/packet_${bobId}.css`,
      bitLength: bobResult.bitLength,
      hint: 'Decrypt with code "stego123"'
    };
    chat_db.push(bobPacket);
    passcode_store.set(bobId, 'stego123');

  } catch (err) {
    console.error('Failed to seed stego complete database:', err);
  }
}

seedDatabase();

// ==========================================
// API Routes (Declared FIRST)
// ==========================================

// Get all contacts
app.get('/api/contacts', (req, res) => {
  res.json(contacts_db);
});

// Create a new contact (by name, phone and/or email id)
app.post('/api/contacts', (req, res) => {
  const { name, phone, email, status, customPasscode } = req.body;

  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: 'Name and at least one contact query (phone or email) is required.' });
  }

  // Check if contact already exists by phone/email
  const exists = contacts_db.find(c => 
    (phone && c.phone === phone) || (email && c.email === email)
  );
  if (exists) {
    return res.json({ success: true, contact: exists, alreadyExisted: true });
  }

  const newContact: Contact = {
    id: 'contact_' + Date.now().toString(),
    name,
    phone: phone || '',
    email: email || '',
    status: status || 'Secure channel enabled.',
    customPasscode: customPasscode || 'stego123'
  };

  contacts_db.push(newContact);

  // Also create a default individual room for this contact immediately!
  const newRoom: ChatRoom = {
    id: 'room_' + newContact.id,
    name: newContact.name,
    isGroup: false,
    memberIds: [newContact.id]
  };
  rooms_db.push(newRoom);

  res.status(201).json({ success: true, contact: newContact, room: newRoom });
});

// Get all active rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms_db);
});

// Create a room (either Group or Individual chat via phone/email lookup)
app.post('/api/rooms', (req, res) => {
  const { name, isGroup, memberIds, phone, email } = req.body;

  if (isGroup) {
    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: 'Group Name and Member IDs list are required.' });
    }
    const newGroup: ChatRoom = {
      id: 'group_' + Date.now().toString(),
      name,
      isGroup: true,
      memberIds
    };
    rooms_db.push(newGroup);
    return res.status(201).json({ success: true, room: newGroup });
  }

  // Individual Room creator or lookup by phone/email!
  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone number or Email ID is required to start a direct secure chat.' });
  }

  // Look if there's a contact matching this phone or email
  let contact = contacts_db.find(c => 
    (phone && c.phone === phone) || (email && c.email === email)
  );

  // If the contact does not exist, let's create a temporary/dynamic member on-the-fly!
  if (!contact) {
    const contactName = phone ? `Contact ${phone}` : `Contact <${email}>`;
    contact = {
      id: 'contact_' + Date.now().toString(),
      name: contactName,
      phone: phone || '',
      email: email || '',
      status: 'Automatically added via direct tunnel.',
      customPasscode: 'stego123'
    };
    contacts_db.push(contact);
  }

  // Check if there is already an individual room for this contact
  let room = rooms_db.find(r => 
    !r.isGroup && r.memberIds && r.memberIds.includes(contact!.id)
  );

  if (!room) {
    room = {
      id: 'room_' + contact.id,
      name: contact.name,
      isGroup: false,
      memberIds: [contact.id]
    };
    rooms_db.push(room);
  }

  res.status(200).json({ success: true, room, contact });
});

// Get all chat packets (excludes sensitive credentials)
app.get('/api/messages', (req, res) => {
  const { roomId } = req.query;
  if (roomId) {
    const filtered = chat_db.filter(p => p.roomId === roomId);
    return res.json(filtered);
  }
  res.json(chat_db);
});

// Post a new steganographic message for a specific room
app.post('/api/messages', (req, res) => {
  const { roomId, sender, message, passcode, theme, hint, recipientPhone, recipientEmail } = req.body;

  if (!roomId || !sender || !message || !passcode || !theme) {
    return res.status(400).json({ error: 'Missing required parameters: roomId, sender, message, passcode, or theme.' });
  }

  try {
    const id = Date.now().toString();
    const result = createStegoCss(sender, message, passcode, theme);
    
    const packet: ChatPacket = {
      id,
      roomId,
      sender,
      timestamp: new Date().toLocaleTimeString(),
      filename: `packet_${id}.css`,
      coverStyle: theme,
      cssContent: result.cssContent,
      cssUrl: `/css/packet_${id}.css`,
      bitLength: result.bitLength,
      hint: hint || `Requires passcode "${passcode.substring(0, Math.min(2, passcode.length))}..."`,
      recipientPhone,
      recipientEmail
    };

    chat_db.push(packet);
    passcode_store.set(id, passcode);

    res.status(201).json({ success: true, packet });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an individual message packet
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const index = chat_db.findIndex(p => p.id === id);
  if (index !== -1) {
    chat_db.splice(index, 1);
    passcode_store.delete(id);
    return res.json({ success: true, message: 'Message deleted successfully.' });
  }
  res.status(404).json({ error: 'Message not found.' });
});

// Delete an entire chat room and all its associated messages
app.delete('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  
  // 1. Check if room exists
  const roomIndex = rooms_db.findIndex(r => r.id === id);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Chat room not found.' });
  }
  
  // 2. Remove room
  rooms_db.splice(roomIndex, 1);
  
  // 3. Remove all messages in this room
  for (let i = chat_db.length - 1; i >= 0; i--) {
    if (chat_db[i].roomId === id) {
      passcode_store.delete(chat_db[i].id);
      chat_db.splice(i, 1);
    }
  }
  
  res.json({ success: true, message: 'Chat tunnel and all associated transmissions purged successfully.' });
});

// Decrypt a message
app.post('/api/decrypt', (req, res) => {
  const { id, passcode } = req.body;

  if (!id || !passcode) {
    return res.status(400).json({ error: 'Packet ID and passcode are required.' });
  }

  const packet = chat_db.find(p => p.id === id);
  if (!packet) {
    return res.status(444).json({ error: 'The requested message packet has expired or does not exist.' });
  }

  try {
    const text = extractAndDecryptMessage(packet.cssContent, passcode);
    res.json({ success: true, decryptedText: text });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Incorrect passphrase' });
  }
});

// Dynamic stylesheet delivery endpoint so CSS files function as normal styles
app.get('/css/:filename', (req, res) => {
  const { filename } = req.params;
  const match = chat_db.find(p => p.filename === filename);
  
  if (!match) {
    return res.status(404).send('/* Semicolon packet css file not found or expired */');
  }

  res.setHeader('Content-Type', 'text/css');
  res.send(match.cssContent);
});

// ==========================================
// Integrations for Web Rendering and Vite Static Assets
// ==========================================

async function setupAndStart() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STEGO SERVER] Listening securely at http://localhost:${PORT}`);
  });
}

setupAndStart();
