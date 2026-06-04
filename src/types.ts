/**
 * Shared Type Definitions for CSS Steganography Chat
 */

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  customPasscode?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  isGroup: boolean;
  recipientPhone?: string; // For typing custom phone to start direct chat
  recipientEmail?: string; // For typing custom email to start direct chat
  memberIds?: string[]; // List of Contact IDs participating in this group
}

export interface ChatPacket {
  id: string;
  roomId: string; // Associations with chat rooms!
  sender: string;
  timestamp: string;
  filename: string;
  coverStyle: string; // The style preset used (e.g., 'cyber-neon', 'terminal-green', 'sunset-pulse')
  cssContent: string;
  cssUrl: string;
  bitLength: number;
  hint?: string;
  recipientPhone?: string;
  recipientEmail?: string;
}

export interface DecryptRequest {
  packetId: string;
  passcode: string;
}

export interface DecryptResponse {
  success: boolean;
  decryptedText?: string;
  binaryLength?: number;
  error?: string;
}

export interface ServerState {
  chat_db: ChatPacket[];
  contacts: Contact[];
  rooms: ChatRoom[];
}
