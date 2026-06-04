import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  MessageSquare, 
  Cpu, 
  Lock, 
  Unlock,
  Download, 
  Info,
  Search,
  Smile,
  Paperclip,
  Send,
  MoreVertical,
  Phone,
  Video,
  X,
  Plus,
  ArrowLeft,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw,
  FileCode,
  User,
  Users,
  CheckCheck,
  Check,
  DownloadCloud,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronRight,
  Database,
  Trash2
} from 'lucide-react';
import { ChatPacket, ChatRoom, Contact } from './types';
import ChatFeed, { getAvatarProps } from './components/ChatFeed';
import CssInspector from './components/CssInspector';

export default function App() {
  // Sync Data State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [packets, setPackets] = useState<ChatPacket[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  
  // Selection States
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<ChatPacket | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'visual' | 'info'>('visual');
  
  // Navigation / Wizard sliding overlays
  const [activePanel, setActivePanel] = useState<'feed' | 'direct' | 'contact' | 'group'>('feed');
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Operator profile configuration
  const [myNickname, setMyNickname] = useState('AgentX');
  const [activePasscode, setActivePasscode] = useState('stego123');
  const [activeThemeStyle, setActiveThemeStyle] = useState('cyber-neon');
  
  // Main chat composer state
  const [composerMessage, setComposerMessage] = useState('');
  
  // Form input states for wizards
  const [directPhone, setDirectPhone] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactPasscode, setContactPasscode] = useState('stego123');
  
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Decryption action state inside bubbles
  const [bubblePasscodes, setBubblePasscodes] = useState<Record<string, string>>({});
  const [bubbleErrors, setBubbleErrors] = useState<Record<string, string>>({});
  const [isDecryptionLoadingId, setIsDecryptionLoadingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  const [isSimulatingAgentReply, setIsSimulatingAgentReply] = useState(false);
  const [simulateBotReplies, setSimulateBotReplies] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch functions for full solidarity sync with the backend
  const fetchPackets = async (quiet = false) => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data: ChatPacket[] = await response.json();
        setPackets(data);
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      console.error('Failed to sync messages:', err);
      setServerStatus('offline');
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('Failed to sync rooms:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to sync contacts:', err);
    }
  };

  const syncAll = async (quiet = false) => {
    if (!quiet) setLoading(true);
    await Promise.all([
      fetchPackets(quiet),
      fetchRooms(),
      fetchContacts()
    ]);
    setLoading(false);
  };

  // Synchronizer Interval with deep-link URL parameter support
  useEffect(() => {
    const initApp = async () => {
      await syncAll();
      const params = new URLSearchParams(window.location.search);
      const deepLinkRoomId = params.get('roomId') || params.get('room');
      if (deepLinkRoomId) {
        setSelectedRoomId(deepLinkRoomId);
        setActivePanel('feed');
      }
    };
    initApp();

    const interval = setInterval(() => {
      syncAll(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // background automated decryption runner
  useEffect(() => {
    const runAutoDecryption = async () => {
      for (const packet of packets) {
        if (!decryptedCache[packet.id] && activePasscode) {
          try {
            const response = await fetch('/api/decrypt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: packet.id, passcode: activePasscode.trim() })
            });
            if (response.ok) {
              const val = await response.json();
              if (val.decryptedText) {
                setDecryptedCache(prev => ({ ...prev, [packet.id]: val.decryptedText }));
              }
            }
          } catch (err) {
            // Suppress - keys may belong to different agents
          }
        }
      }
    };
    if (packets.length > 0) {
      runAutoDecryption();
    }
  }, [packets, activePasscode]);

  // Auto Scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packets, selectedRoomId]);

  // Bubble specific manual unlock helper
  const handleBubbleDecrypt = async (packetId: string, customCode: string) => {
    if (!customCode.trim()) return;
    setIsDecryptionLoadingId(packetId);
    setBubbleErrors(prev => ({ ...prev, [packetId]: '' }));

    try {
      const response = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: packetId, passcode: customCode.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Incorrect passcode');
      }

      const val = await response.json();
      setDecryptedCache(prev => ({
        ...prev,
        [packetId]: val.decryptedText
      }));
    } catch (err: any) {
      setBubbleErrors(prev => ({
        ...prev,
        [packetId]: err.message || 'Decryption failed'
      }));
    } finally {
      setIsDecryptionLoadingId(null);
    }
  };

  // Handle room selection: also preloads the last packet to dissect
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActivePanel('feed');

    const roomPackets = packets.filter(p => p.roomId === roomId);
    if (roomPackets.length > 0) {
      setSelectedPacket(roomPackets[roomPackets.length - 1]);
    } else {
      setSelectedPacket(null);
    }
  };

  // Delete an individual message transmission
  const handleDeleteMessage = async (packetId: string) => {
    try {
      const response = await fetch(`/api/messages/${packetId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Remove from local packet state immediately to avoid waiting for sync interval
        setPackets(prev => prev.filter(p => p.id !== packetId));
        // Also remove from selected packet if it's currently selected in details drawer
        if (selectedPacket?.id === packetId) {
          setSelectedPacket(null);
        }
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete transmission.');
      }
    } catch (e: any) {
      alert('Error occurred while deleting: ' + e.message);
    }
  };

  // Delete an entire chat room and its messages
  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Remove from local rooms and packets immediately
        setRooms(prev => prev.filter(r => r.id !== roomId));
        setPackets(prev => prev.filter(p => p.roomId !== roomId));
        if (selectedRoomId === roomId) {
          setSelectedRoomId(null);
          setSelectedPacket(null);
        }
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete chat room.');
      }
    } catch (e: any) {
      alert('Error occurred while deleting room: ' + e.message);
    }
  };

  // Trigger simulated replies to make the WhatsApp/BBM experience highly interactive
  const simulateAgentReply = (roomId: string, userText: string) => {
    const activeRoom = rooms.find(r => r.id === roomId);
    if (!activeRoom) return;

    setIsSimulatingAgentReply(true);

    setTimeout(async () => {
      try {
        let responderName = '🕵️‍♀️ Agent Alice';
        let responderPasscode = 'sunset77';
        let responderTheme = 'sunset-pulse';

        // Select responder from room
        if (activeRoom.isGroup && activeRoom.memberIds && activeRoom.memberIds.length > 0) {
          const firstId = activeRoom.memberIds[0];
          const matched = contacts.find(c => c.id === firstId);
          if (matched) {
            responderName = matched.name;
            responderPasscode = matched.customPasscode || 'stego123';
          }
        } else if (!activeRoom.isGroup && activeRoom.memberIds && activeRoom.memberIds.length > 0) {
          const matched = contacts.find(c => c.id === activeRoom.memberIds![0]);
          if (matched) {
            responderName = matched.name;
            responderPasscode = matched.customPasscode || 'stego123';
          }
        }

        // Stego responses bank
        const responses = [
          `Visual grid parameters verified! The stego coordinates align. Decryption passcode established on standard key "${responderPasscode}".`,
          `Acknowledged. Sending stylesheet envelope with injected payload. Confirm receipt on terminal. Semicolons: OK.`,
          `Cover design finalized. Safe bits are hidden trailed inside the visual matrix. Run unseal using key "${responderPasscode}".`,
          `Classification shipment transmitted. The design is styled with a subtle backdrop. Decode with custom PIN.`,
          `Standard CSS blueprint locked. Signal coordinates are safely obscured. Keep channel open.`
        ];

        const randomText = responses[Math.floor(Math.random() * responses.length)];

        // Post to backend
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            sender: responderName,
            message: randomText,
            passcode: responderPasscode,
            theme: responderTheme,
            hint: `Encrypted by ${responderName}. Cipher key: "${responderPasscode}"`
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Pre-decrypt in client cache for ease if user active passcode matches!
          if (responderPasscode === activePasscode) {
             setDecryptedCache(prev => ({ ...prev, [result.packet.id]: randomText }));
          }
          fetchPackets(true);
        }
      } catch (err) {
        console.error('Simulated response error:', err);
      } finally {
        setIsSimulatingAgentReply(false);
      }
    }, 2000);
  };

  // Send message composer action
  const handleComposerSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerMessage.trim() || !selectedRoomId) return;

    const messageText = composerMessage.trim();
    setComposerMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          sender: myNickname || 'You',
          message: messageText,
          passcode: activePasscode.trim() || 'stego123',
          theme: activeThemeStyle,
          hint: `Sender PIN: "${activePasscode.substring(0, Math.min(2, activePasscode.length))}..." / Style: ${activeThemeStyle}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // pre-save own decrypted text
        if (data.packet) {
          setDecryptedCache(prev => ({ ...prev, [data.packet.id]: messageText }));
          setSelectedPacket(data.packet);
        }
        await fetchPackets(true);
        
        // Optional: simulate agent replies for testing if enabled
        if (simulateBotReplies) {
          simulateAgentReply(selectedRoomId, messageText);
        }
      }
    } catch (err) {
      console.error('Composer send failed:', err);
    }
  };

  // Direct chat initiation (by Phone Number or Email ID lookup)
  const handleStartDirectChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const queryPhone = directPhone.trim();
    const queryEmail = directEmail.trim();

    if (!queryPhone && !queryEmail) {
      setFormError('Please enter either a known Phone number or an Email ID.');
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: false,
          phone: queryPhone,
          email: queryEmail
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Server refused to start chat.');
      }

      const data = await response.json();
      setFormSuccess(`Established secure tunnel room: "${data.room.name}"`);
      setDirectPhone('');
      setDirectEmail('');
      
      // Select the room and sync
      await syncAll(true);
      handleSelectRoom(data.room.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to start direct tunnel.');
    }
  };

  // Add contact form submit
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!contactName.trim()) {
      setFormError('Contact display name is required.');
      return;
    }
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setFormError('Provide at least a Phone Number or Email ID.');
      return;
    }

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          status: contactStatus.trim() || 'Active secure operator Node.',
          customPasscode: contactPasscode.trim() || 'stego123'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register contact.');
      }

      const data = await response.json();
      setFormSuccess(`Added contact "${data.contact.name}". Secure P2P room created!`);
      
      // Reset fields
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactStatus('');
      setContactPasscode('stego123');

      await syncAll(true);
      if (data.room) {
        handleSelectRoom(data.room.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to add contact.');
    }
  };

  // Assemble Group form submit
  const handleAssembleGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!groupName.trim()) {
      setFormError('Please enter a Group Name.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setFormError('Please select at least 1 contact member.');
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim() + ' (GROUP)',
          memberIds: selectedMemberIds
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create group.');
      }

      const data = await response.json();
      setFormSuccess(`Group "${data.room.name}" compiled successfully!`);
      
      setGroupName('');
      setSelectedMemberIds([]);

      await syncAll(true);
      handleSelectRoom(data.room.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to compile group.');
    }
  };

  // Handle members multi-select keys
  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter(mid => mid !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  // Derived properties
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const activeRoomPackets = packets.filter(p => p.roomId === selectedRoomId);
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.recipientPhone && room.recipientPhone.includes(searchQuery)) ||
    (room.recipientEmail && room.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Active chat room participants
  const getRoomParticipants = () => {
    if (!selectedRoom) return [];
    if (!selectedRoom.isGroup) {
      if (selectedRoom.memberIds && selectedRoom.memberIds.length > 0) {
        const c = contacts.find(contact => contact.id === selectedRoom.memberIds![0]);
        return c ? [c] : [];
      }
      return [];
    }
    // group members
    return contacts.filter(c => selectedRoom.memberIds?.includes(c.id));
  };

  const participants = getRoomParticipants();

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070b11] flex items-center justify-center font-sans antialiased text-slate-200">
      
      {/* Decrotive BBM top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-r from-[#172030] via-[#0080ff]/20 to-[#172030] z-0 border-b border-[#233045] opacity-90 shadow-lg" />

      {/* Main Responsive BlackBerry Frame */}
      <div className="w-full h-full md:h-[95vh] md:max-h-[900px] md:w-[96vw] md:max-w-[1530px] md:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative z-10 bg-[#0b0e14] border border-[#233045] overflow-hidden flex">
        
        {/* PANEL 1: SIDEBAR (Chat list / Creators / config) */}
        <div className="w-full md:w-[380px] lg:w-[410px] shrink-0 border-r border-[#202d42] flex flex-col h-full bg-[#111622] relative z-20">
          
          {/* Header Profile - BBM glossy steel bar */}
          <div className="h-[65px] bbm-glossy-bar px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsProfileEditing(!isProfileEditing)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-500/50 hover:border-[#0080ff] transition-all flex items-center justify-center text-xs font-mono font-bold text-slate-100 shadow-md relative group cursor-pointer"
                title="Open Client Configuration"
              >
                <span>{myNickname.substring(0, 2).toUpperCase()}</span>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 border border-[#111622] animate-pulse" />
              </button>
              
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-100 leading-none">
                  {myNickname} (You)
                </span>
                <span className="text-[9px] text-[#0080ff] font-mono tracking-wider uppercase leading-none font-bold mt-1.5 inline-block">
                  PIN CODE: {activePasscode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsProfileEditing(!isProfileEditing)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isProfileEditing ? 'text-[#0080ff] border-[#0080ff]/20 bg-[#0080ff]/5' : 'text-slate-300 border-transparent hover:border-[#202d42]'}`}
                title="BBM Private Passkeys"
              >
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>

          {/* Quick inline Profile Config sliding overlay */}
          {isProfileEditing && (
            <div className="p-4 bg-[#1a2336] border-b border-[#233045] animate-in slide-in-from-top duration-200 text-left space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-mono font-bold text-[#0080ff] uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3 h-3" /> OPERATOR CREDENTIALS manager
                </h4>
                <button onClick={() => setIsProfileEditing(false)} className="text-slate-450 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-[8.5px] text-slate-400 uppercase font-mono block">NICKNAME</label>
                  <input 
                    type="text" 
                    value={myNickname}
                    onChange={(e) => setMyNickname(e.target.value)}
                    className="w-full bg-[#0e1320] border border-[#233045] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#0080ff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] text-slate-400 uppercase font-mono block">DECRYPTION CIPHER KEY</label>
                  <input 
                    type="text" 
                    value={activePasscode}
                    onChange={(e) => setActivePasscode(e.target.value)}
                    className="w-full bg-[#0e1320] border border-[#233045] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#0080ff]"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 font-sans text-[10px] text-slate-400">
                <div>
                  <span className="block text-[8.5px] text-slate-400 uppercase font-mono">AUTO-ENCODING preset</span>
                  <select
                    value={activeThemeStyle}
                    onChange={(e) => setActiveThemeStyle(e.target.value)}
                    className="bg-[#0e1320] border border-[#233045] rounded px-1.5 py-0.5 mt-0.5 text-[9.5px] text-[#0080ff] focus:outline-none font-mono text-left"
                  >
                    <option value="cyber-neon">Cyber Neon Design</option>
                    <option value="terminal-green">Terminal phosphor Green</option>
                    <option value="sunset-pulse">Ambient Sunset glow</option>
                  </select>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="checkbox"
                      id="simulateBotRepliesToggle"
                      checked={simulateBotReplies}
                      onChange={(e) => setSimulateBotReplies(e.target.checked)}
                      className="cursor-pointer focus:outline-none w-3 h-3 accent-[#0080ff]"
                    />
                    <label htmlFor="simulateBotRepliesToggle" className="text-[9px] text-[#00ff7f] font-mono uppercase font-bold cursor-pointer select-none">
                      AI Bot responses
                    </label>
                  </div>
                  <p className="text-[8.5px] text-slate-500 font-mono">P2P connection mode is active.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick wizard tabs row */}
          <div className="bg-[#0c101a] border-b border-[#233045] px-2 py-1.5 flex gap-1 justify-around shrink-0 text-slate-300">
            <button 
              onClick={() => setActivePanel(activePanel === 'direct' ? 'feed' : 'direct')}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-mono tracking-wide uppercase flex items-center justify-center gap-1 ${activePanel === 'direct' ? 'bg-[#0080ff]/15 text-[#0080ff] font-bold border border-[#0080ff]/20' : 'hover:bg-white/5 bg-transparent border border-transparent'}`}
              title="Start Chat with known phone/email"
            >
              <Phone className="w-3 h-3 text-[#0080ff]" /> Direct chat
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'contact' ? 'feed' : 'contact')}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-mono tracking-wide uppercase flex items-center justify-center gap-1 ${activePanel === 'contact' ? 'bg-[#0080ff]/15 text-[#0080ff] font-bold border border-[#0080ff]/20' : 'hover:bg-white/5 bg-transparent border border-transparent'}`}
              title="Add known contact"
            >
              <Plus className="w-3 h-3 text-[#0080ff]" /> Add contact
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'group' ? 'feed' : 'group')}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-mono tracking-wide uppercase flex items-center justify-center gap-1 ${activePanel === 'group' ? 'bg-[#0080ff]/15 text-[#0080ff] font-bold border border-[#0080ff]/10' : 'hover:bg-white/5 bg-transparent border border-transparent'}`}
              title="Assemble group from known members"
            >
              <Users className="w-3 h-3 text-[#0080ff]" /> New Group
            </button>
          </div>

          {/* Collapsible wizard panels drawer */}
          {activePanel !== 'feed' && (
            <div className="p-4 bg-[#141b28] border-b border-[#233045] text-left shrink-0 animate-in slide-in-from-top duration-250">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10.5px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  {activePanel === 'direct' && <><Phone className="w-3.5 h-3.5 text-[#0080ff]" /> DIRECT secure CHANNEL</>}
                  {activePanel === 'contact' && <><Plus className="w-3.5 h-3.5 text-[#0080ff]" /> REGISTER MEMBER ADDRESS</>}
                  {activePanel === 'group' && <><Users className="w-3.5 h-3.5 text-[#0080ff]" /> ASSEMBLE GROUP KEY</>}
                </h4>
                <button onClick={() => { setActivePanel('feed'); setFormError(null); setFormSuccess(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {formError && (
                <div className="p-2 mb-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono rounded flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-2 mb-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded flex items-start gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Wizard 1: Direct Chat Builder */}
              {activePanel === 'direct' && (
                <form onSubmit={handleStartDirectChat} className="space-y-2.5 text-xs">
                  <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
                    Type a recipient's known Phone number or Email ID to open or spawn a private symmetric stego chat room instantly!
                  </p>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block">PHONE NUMBER</label>
                    <input 
                      type="text" 
                      placeholder="e.g., +1 (555) 777-0101" 
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                    />
                  </div>
                  <div className="text-center text-[9px] font-mono text-slate-500 font-bold">OR</div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block">SECURE EMAIL ID</label>
                    <input 
                      type="email" 
                      placeholder="e.g., recipient@agency.gov" 
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-[#0080ff] hover:bg-blue-600 rounded text-[10.5px] font-mono uppercase font-bold text-slate-950 flex items-center justify-center gap-1 cursor-pointer font-bold leading-none mt-2"
                  >
                    <span>Initiate Stego Connection</span>
                  </button>
                </form>
              )}

              {/* Wizard 2: Add Contact */}
              {activePanel === 'contact' && (
                <form onSubmit={handleAddContact} className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block">MEMBER DISPLAY NAME</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Operator Agent Q" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-mono text-slate-400 block">PHONE NUMBER</label>
                      <input 
                        type="text" 
                        placeholder="e.g., +1 (555) 555-5555" 
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-mono text-slate-400 block">EMAIL ID</label>
                      <input 
                        type="email" 
                        placeholder="q@covert.gov" 
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block">STATUS SIGNATURE</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Scrutinizing stylesheets" 
                      value={contactStatus}
                      onChange={(e) => setContactStatus(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block font-bold">PRIVATE CIPHER KEY (DEFAULT PASSCODE)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., key99" 
                      value={contactPasscode}
                      onChange={(e) => setContactPasscode(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] font-mono text-blue-400"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-[#0080ff] hover:bg-blue-600 rounded text-[10.5px] font-mono uppercase font-bold text-slate-950 flex items-center justify-center gap-1 cursor-pointer font-bold leading-none mt-1"
                  >
                    <span>Register Node to Directory</span>
                  </button>
                </form>
              )}

              {/* Wizard 3: Create Group Chat */}
              {activePanel === 'group' && (
                <form onSubmit={handleAssembleGroup} className="space-y-2.5 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-slate-400 block">GROUP CHANNEL NAME</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. SECURE OPERATIONS BLUEPRINT" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#233045] rounded p-1.5 focus:outline-none focus:border-[#0080ff] text-white"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[8.5px] font-mono text-slate-400 block font-bold">CHOOSE KNOWN MEMBERS ({selectedMemberIds.length} SELECTED)</label>
                    <div className="max-h-[140px] overflow-y-auto bg-[#0c101a] border border-[#233045] rounded p-2 divide-y divide-white/5 scrollbar-thin">
                      {contacts.map(c => {
                        const checked = selectedMemberIds.includes(c.id);
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => toggleMemberSelection(c.id)}
                            className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <span className="text-slate-200 font-sans font-medium">{c.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9.2px] font-mono text-slate-500 font-normal">{c.phone || c.email}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-[#0080ff] border-[#0080ff]' : 'border-[#233045] bg-[#0c101a]'}`}>
                                {checked && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {contacts.length === 0 && (
                        <p className="text-center font-mono text-[10px] text-slate-600 p-4">No contacts added yet.</p>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-[#0080ff] hover:bg-blue-600 rounded text-[10.5px] font-mono uppercase font-bold text-slate-950 flex items-center justify-center gap-1 cursor-pointer font-bold leading-none mt-2"
                  >
                    <span>Assemble Group Network</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Search bar row */}
          <div className="p-2 shrink-0 bg-[#111622] border-b border-[#1e293c]/50 relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="search-chat"
                type="text"
                placeholder="Search secure networks, emails, phone numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#182030] hover:bg-[#1e283b] focus:bg-[#1e283b] text-xs font-sans rounded-lg pl-9 pr-4 py-2 transition-colors border border-[#25334a]/30 text-slate-100 placeholder-slate-450 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-450" />
            </div>
            
            <span className={`w-2 h-2 rounded-full shrink-0 ${serverStatus === 'online' ? 'bg-[#0080ff] shadow-[0_0_8px_#0080ff]' : 'bg-red-500'}`} title={serverStatus === 'online' ? 'BBM Server Hooked' : 'BBM Network Disconnected'} />
          </div>

          {/* Chat Rooms listing */}
          <div className="flex-1 overflow-hidden">
            <ChatFeed
              rooms={filteredRooms}
              packets={packets}
              contacts={contacts}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              decryptedCache={decryptedCache}
              onDeleteRoom={handleDeleteRoom}
            />
          </div>

          {/* Quick Guide Footer */}
          <div className="p-3 bg-[#0d121c] border-t border-[#233045] text-xs leading-normal text-left text-slate-450 font-mono text-[9px] flex items-center gap-2 select-none">
            <Database className="w-4 h-4 text-[#0080ff]" />
            <div className="flex-1">
              <strong>STEGO MATRIX CONTROLS:</strong>
              <p className="font-sans text-[8.5px] leading-tight text-slate-500 mt-0.5">Symmetric bits read automatically inside active channels. Add contacts to seed secret passphrases.</p>
            </div>
          </div>
        </div>

        {/* PANEL 2: MIDDLE CHAT CONVERSATION */}
        <div className="flex-1 flex flex-col h-full bg-[#0b0e14] relative z-10 overflow-hidden bbm-wall">
          {selectedRoom ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-[65px] bbm-glossy-bar px-4 flex items-center justify-between shrink-0 relative z-10 border-b border-[#233045]">
                <div className="flex items-center gap-3">
                  {/* Sender Avatar */}
                  <div 
                    onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarProps(selectedRoom.name).gradient} flex items-center justify-center text-slate-950 font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity border border-white/10`}
                  >
                    {selectedRoom.isGroup ? <Users className="w-5 h-5 text-slate-950" /> : getAvatarProps(selectedRoom.name).initials}
                  </div>
                  
                  {/* Title and participants log */}
                  <div 
                    onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
                    className="text-left cursor-pointer group"
                  >
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-[#0080ff] transition-colors leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {selectedRoom.name}
                    </h3>
                    <p className="text-[10px] text-[#0080ff] flex items-center gap-1.5 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0000ff] bg-emerald-400 animate-pulse" />
                      {selectedRoom.isGroup 
                        ? `${participants.length + 1} MEMBERS IN COVERT CHANNEL` 
                        : 'DIRECT SYM-CIPHER ACTIVE'}
                    </p>
                  </div>
                </div>

                {/* Right utility buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(!isRightDrawerOpen);
                      setRightPanelTab('visual');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isRightDrawerOpen && rightPanelTab === 'visual'
                        ? 'bg-[#0080ff]/15 text-[#0080ff] border border-[#0080ff]/30'
                        : 'bg-white/10 text-slate-200 border border-[#233045] hover:bg-white/20'
                    }`}
                    title="Toggle Stylesheet Sandbox Matrix Draw"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Dissect File</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(!isRightDrawerOpen);
                      setRightPanelTab('info');
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isRightDrawerOpen && rightPanelTab === 'info'
                        ? 'bg-[#00a884]/15 text-[#00a884] border-[#00a884]/30'
                        : 'text-slate-300 border-transparent hover:border-[#233045]'
                    }`}
                    title="Stylesheet details"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Thread Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
                
                {/* System Notice Bubble */}
                <div className="w-full flex justify-center text-center py-2 select-none">
                  <div className="max-w-md bg-[#161d2a] border border-[#233045] rounded-xl px-4 py-2.5 text-[11px] text-[#0080ff] font-mono shadow-md flex items-start gap-2.5 text-left leading-normal">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#0080ff]" />
                    <div>
                      <strong className="text-slate-100">STG TUNNEL ({selectedRoom.name}):</strong>
                      <p className="text-slate-400 text-[10px] mt-0.5 font-sans leading-normal">
                        All cleartext is encrypted with AES-256 block-ciphers and woven trail-wise behind standard CSS semicolons. Click "Dissect File" or any document card to examine standard CSS parameters!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Message Loops */}
                {activeRoomPackets.map((p) => {
                  const isMine = p.sender === myNickname || p.sender === 'You';
                  const isDecrypted = !!decryptedCache[p.id];
                  const plainText = decryptedCache[p.id];
                  const avatar = getAvatarProps(p.sender);

                  return (
                    <div 
                      key={p.id} 
                      className={`w-full flex ${isMine ? 'justify-end' : 'justify-start'} text-left animate-in fade-in duration-200`}
                    >
                      <div className={`flex items-start gap-2.5 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {!isMine && (
                          <div className={`w-8 h-8 rounded-lg shrink-0 bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm border border-[#233045]`}>
                            {avatar.initials}
                          </div>
                        )}

                        {/* Speech Bubble body */}
                        <div className={`p-3.5 shadow-lg border relative ${
                          isMine 
                            ? 'bbm-bubble-out border-[#0080ff]/20' 
                            : 'bbm-bubble-in border-[#25334c]/50'
                        }`}>
                          {/* Sender name label */}
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className={`block text-[10.5px] font-mono leading-none tracking-wider font-bold uppercase pointer-events-none ${
                              isMine ? 'text-blue-400' : 'text-[#0080ff]'
                            }`}>
                              {isMine ? 'You (Operator)' : p.sender}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm('Purge this message packet permanently? It will be deleted from your secure logs.')) {
                                  handleDeleteMessage(p.id);
                                }
                              }}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                              title="Delete transmission packet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* BlackBerry CSS stylesheet envelope card */}
                          <div className="bg-black/45 border border-[#233045] rounded-lg p-2.5 font-mono text-[10.5px] text-slate-300 flex items-center justify-between gap-4 select-none">
                            <div className="flex items-center gap-2 truncate">
                              <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
                              <div className="truncate text-left text-[11px]">
                                <span className="text-slate-500 block text-[9px] leading-none">STYLESHEET ATTACHMENT</span>
                                <span className="font-bold text-slate-200 block truncate mt-1">
                                  {p.filename}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedPacket(p);
                                  setIsRightDrawerOpen(true);
                                  setRightPanelTab('visual');
                                }}
                                className="px-2 py-1 text-[9px] bg-[#1e293c] hover:bg-[#2a3852] border border-[#2e3e56] rounded font-mono font-bold text-slate-200 transition-colors uppercase cursor-pointer"
                                title="Load stylesheet details"
                              >
                                Examine
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-white/5 mt-2.5 pt-2" />

                          {/* Cleartext display or decryption lock forms */}
                          {isDecrypted ? (
                            <div className="mt-1 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
                              <span className="text-[9px] font-mono uppercase bg-[#0080ff]/10 text-[#0080ff] border border-[#0080ff]/20 px-1.5 py-0.5 rounded font-bold inline-block mb-1.5 font-bold pointer-events-none select-none">
                                🔓 Unsealed Payload Cleartext
                              </span>
                              <p className="text-sm font-sans text-white leading-relaxed break-words font-medium antialiased">
                                {plainText}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-1 text-left space-y-2">
                              <span className="text-[10px] font-mono flex items-center gap-1 text-amber-500 font-bold uppercase tracking-wider select-none pointer-events-none">
                                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                STEGO CSS WHITESPACE PACKET Encrypted
                              </span>
                              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                Symmetric cipher key mismatch. Provide correct cryptographic key to unseal trailing semicolon bits:
                              </p>

                              {/* Unlock key inline box */}
                              <div className="flex gap-1 max-w-sm">
                                <input
                                  type="password"
                                  placeholder="Type decryption key..."
                                  value={bubblePasscodes[p.id] || ''}
                                  onChange={(e) => setBubblePasscodes({ ...bubblePasscodes, [p.id]: e.target.value })}
                                  className="bg-black/35 border border-[#233045] rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 flex-1 font-mono focus:outline-none focus:border-[#0080ff]"
                                />
                                <button
                                  onClick={() => handleBubbleDecrypt(p.id, bubblePasscodes[p.id] || '')}
                                  disabled={isDecryptionLoadingId === p.id || !(bubblePasscodes[p.id] || '').trim()}
                                  className="bg-[#0080ff] hover:bg-blue-600 disabled:opacity-50 text-slate-950 font-bold px-3 py-1 rounded text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {isDecryptionLoadingId === p.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                                  ) : null}
                                  <span>Decrypt</span>
                                </button>
                              </div>
                              {bubbleErrors[p.id] && (
                                <p className="text-[10px] font-mono text-red-400 flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{bubbleErrors[p.id]}</span>
                                </p>
                              )}
                              {p.hint && (
                                <p className="text-[10px] font-sans text-slate-400 italic bg-black/20 p-1.5 rounded border border-white/5 leading-snug mt-1.5">
                                  🔍 Public hint parameter: {p.hint}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Metadata row */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3 border-t border-white/5 pt-2 select-none pointer-events-none">
                            <span className="uppercase text-[9px] text-[#0080ff] font-bold">
                              {p.bitLength} STEGO bits
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span>{p.timestamp}</span>
                              {isDecrypted ? (
                                <span className="w-4 h-4 rounded bg-[#0080ff] text-slate-950 flex items-center justify-center text-[9px] font-bold">R</span>
                              ) : (
                                <span className="w-4 h-4 rounded bg-slate-700 text-slate-300 flex items-center justify-center text-[9px] font-bold">D</span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show simulated writing typing alert when simulated response is on focus */}
                {isSimulatingAgentReply && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00ff7f] tracking-wide animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Agent cipher packet compilation in progress...</span>
                  </div>
                )}

                {activeRoomPackets.length === 0 && (
                  <div className="py-14 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-400 font-mono">No Covert Transmission Channels Active</p>
                    <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto mt-1 leading-normal">
                      This tunnel currently displays no CSS files. Type some secrets in the composer below to compile the inaugural stylesheet packet!
                    </p>
                  </div>
                )}

                {/* Scroll Anchor */}
                <div ref={chatEndRef} />

              </div>

              {/* Chat Composer bar */}
              <div className="bg-[#151a25] px-4 py-3 flex items-center justify-between gap-3 shrink-0 relative z-10 border-t border-[#233045]">
                <div className="flex items-center gap-3 text-slate-450 shrink-0 select-none">
                  <button className="p-1.5 hover:text-white transition-colors cursor-pointer" title="Add secure symbols">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsRightDrawerOpen(!isRightDrawerOpen);
                      setRightPanelTab('visual');
                    }}
                    className="p-1.5 hover:text-white transition-colors cursor-pointer" 
                    title="Transfer new custom CSS File"
                  >
                    <Paperclip className="w-5 h-5 text-[#0080ff]" />
                  </button>
                </div>

                {/* Submit Composer form */}
                <form onSubmit={handleComposerSend} className="flex-1 flex items-center gap-2">
                  <input
                    id="message-composer"
                    type="text"
                    required
                    maxLength={140}
                    placeholder={`Write text to embed trailing semicolons using active key "${activePasscode}"...`}
                    value={composerMessage}
                    onChange={(e) => setComposerMessage(e.target.value)}
                    className="bg-[#0e131d] hover:bg-[#121926] focus:bg-[#121926] text-xs font-sans rounded-xl px-4 py-2.5 flex-1 transition-colors border border-[#233045] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#0080ff]"
                  />
                  
                  {/* Circular Send */}
                  <button
                    type="submit"
                    disabled={!composerMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-650 text-white flex items-center justify-center shadow hover:opacity-90 disabled:opacity-50 transition-all shrink-0 cursor-pointer border border-blue-500/35"
                    title="Inject Stego Whitespaces & Broadcast"
                  >
                    <Send className="w-4.5 h-4.5 text-slate-100" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* BBM Splash welcome screen */
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-[#0b0e14] relative overflow-hidden bbm-wall select-none">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0080ff]/5 rounded-full blur-[140px] pointer-events-none" />
              
              <div className="w-24 h-24 rounded-2xl bg-[#141b29] border border-[#233045] flex items-center justify-center text-slate-450 mb-6 shadow-2xl leading-none">
                <KeyRound className="w-11 h-11 text-[#0080ff] animate-pulse" />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold font-mono text-slate-100 tracking-wider uppercase">
                COVERT STEGOBBM <span className="text-[#0080ff] font-light italic text-lg tracking-normal">TUNNEL CONSOLE</span>
              </h2>
              
              <p className="text-xs text-slate-400 max-w-sm mt-3 leading-relaxed font-sans">
                A high-security steganographic workstation masking multi-ciphers and text payloads completely inside functional, compliant CSS sheets. Semicolons generate transparent spacer grids.
              </p>

              <div className="mt-8 border border-dashed border-[#233045] w-1/2 max-w-xs" />

              <div className="flex flex-col items-center gap-1.5 mt-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-normal">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-green-500 animate-pulse" />
                  Operator Cipher Matrices Sync Active
                </span>
                <span>Select active tunnel channel from left lists, or create target phone/email</span>
              </div>
            </div>
          )}

        </div>

        {/* PANEL 3: RIGHT COLLAPSIBLE EXAMINATION DRAWER */}
        {isRightDrawerOpen && (
          <div className="w-full md:w-[380px] lg:w-[410px] shrink-0 border-l border-[#202d42] flex flex-col h-full bg-[#111116] relative z-20 animate-in slide-in-from-right duration-250 text-slate-200">
            {/* Header info bar */}
            <div className="h-[65px] bbm-glossy-bar px-4 flex items-center justify-between shrink-0 border-b border-[#233045] select-none text-slate-200">
              <span className="font-bold text-sm tracking-tight flex items-center gap-2 font-mono text-[#0080ff] uppercase">
                {rightPanelTab === 'visual' ? (
                  <><Cpu className="w-4 h-4" /> STYLESHEET BIT EXAMINER</>
                ) : (
                  <><Info className="w-4 h-4" /> SECURE NODE DIRECTORIES</>
                )}
              </span>
              <button
                onClick={() => setIsRightDrawerOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Collapse drawer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Contents tabs switcher */}
            {rightPanelTab === 'visual' ? (
              <div className="flex-1 overflow-hidden">
                <CssInspector
                  packet={selectedPacket}
                  onDecrypted={(pId, text) => {
                    setDecryptedCache(prev => ({ ...prev, [pId]: text }));
                  }}
                />
              </div>
            ) : (
              /* Node Directory detail view */
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left text-xs font-sans">
                {selectedRoom ? (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Secure Tunnel Address</span>
                      <h3 className="text-base font-bold text-slate-100 font-mono text-[#00a884] uppercase">
                        {selectedRoom.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Channel type: <span className="font-mono text-[10px] text-slate-100">{selectedRoom.isGroup ? 'GROUP MULTICAST' : 'DIRECT SYMMETRIC P2P'}</span>
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#171c28] border border-[#233045] rounded-xl space-y-3 font-sans">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#0080ff] uppercase tracking-wider font-bold">
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tunnel Invitation Portal</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Share this direct connection link so another human operator can open their secure viewport entry to this chat room on their device:
                      </p>
                      
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/?roomId=${selectedRoom.id}`}
                          className="bg-black/40 border border-[#233045] rounded px-2.5 py-1 text-[10px] text-indigo-300 font-mono flex-1 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?roomId=${selectedRoom.id}`);
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2000);
                          }}
                          className="px-3 py-1 bg-[#0080ff] hover:bg-blue-600 font-mono text-[10px] text-slate-950 font-bold rounded transition-colors uppercase cursor-pointer"
                        >
                          {copySuccess ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>

                      {/* Outbound Notify options */}
                      {participants.some(p => p.phone || p.email) && (
                        <div className="space-y-2 pt-1.5 border-t border-[#233045]/50">
                          <span className="text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wider block">
                            📢 Outbound Contact Alerts
                          </span>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            If this chat is with a real-life contact, click a preset below to dispatch a secure text/email ping notifying them someone is trying to connect.
                          </p>

                          <div className="space-y-1.5">
                            {participants.map(p => {
                              if (!p.phone && !p.email) return null;
                              const encodedMsg = encodeURIComponent(
                                `OPERATOR ACTION REQUIRED:\n\nSomeone is trying to reach you with a secure CSS steganography packet!\n\nOpen our private connection channel directly at:\n${window.location.origin}/?roomId=${selectedRoom.id}\n\nCryptographic PIN Key: "${activePasscode}"`
                              );
                              
                              return (
                                <div key={p.id} className="bg-black/20 p-2 rounded border border-[#233045] space-y-2">
                                  <div className="text-[10px] font-mono text-slate-350 font-bold block">
                                    Operator: {p.name}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {p.phone && (
                                      <a
                                        href={`https://api.whatsapp.com/send?phone=${p.phone.replace(/[^0-9]/g, '')}&text=${encodedMsg}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 bg-[#25d366]/15 hover:bg-[#25d366]/25 text-[#25d366] font-mono text-[9px] rounded transition-all uppercase font-bold flex items-center gap-1 select-none border border-[#25d366]/25"
                                      >
                                        <span>WhatsApp Ping ➔</span>
                                      </a>
                                    )}
                                    {p.email && (
                                      <a
                                        href={`mailto:${p.email}?subject=${encodeURIComponent("SECURE COVERT COMMUNICATIONS RECEIVED")}&body=${encodedMsg}`}
                                        className="px-2 py-1 bg-[#0080ff]/15 hover:bg-[#0080ff]/25 text-[#0080ff] font-mono text-[9px] rounded transition-all uppercase font-bold flex items-center gap-1 select-none border border-[#0080ff]/25"
                                      >
                                        <span>Email Memo ➔</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#233045]" />

                    <div className="space-y-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Active Connection Nodes ({participants.length})</span>
                      
                      <div className="space-y-3">
                        {/* Render active contact accounts details */}
                        {participants.map(p => (
                          <div key={p.id} className="p-3.5 bg-[#171b26] border border-[#233045] rounded-xl space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-200 block text-xs">{p.name}</span>
                              <span className="text-[9px] bg-[#0080ff]/10 text-[#0080ff] px-1.5 py-0.5 rounded font-mono font-bold uppercase">Node verified</span>
                            </div>
                            
                            <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                              {p.phone && <p>📞 Phone: {p.phone}</p>}
                              {p.email && <p>✉️ Email ID: {p.email}</p>}
                              <p className="text-[#00ff7f]">🔑 PIN SECRET: "{p.customPasscode}"</p>
                            </div>
                            <div className="italic text-[10.5px] text-slate-400 italic bg-black/20 p-2 rounded leading-snug font-sans">
                              "{p.status}"
                            </div>
                          </div>
                        ))}

                        {/* Always include ourselves */}
                        <div className="p-3.5 bg-[#171b26] border border-[#233045] rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-200 block text-xs">{myNickname} (You)</span>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Our Term</span>
                          </div>
                          
                          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                            <p>🤖 Client PIN Code: {activePasscode}</p>
                            <p className="text-zinc-500">Node Location: Local Session</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center my-10 text-slate-500">
                    <p className="font-mono text-xs">No active directory room open.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
