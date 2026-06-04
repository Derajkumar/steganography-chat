import React from 'react';
import { Lock, FileCode, Users, MessageSquare, Trash2 } from 'lucide-react';
import { ChatPacket, ChatRoom, Contact } from '../types';

interface ChatFeedProps {
  rooms: ChatRoom[];
  packets: ChatPacket[];
  contacts: Contact[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  decryptedCache: Record<string, string>;
  onDeleteRoom?: (roomId: string) => void;
}

// Generate circular randomized initial avatars
export function getAvatarProps(name: string) {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-purple-500 to-fuchsia-600',
    'from-amber-500 to-orange-650',
    'from-cyan-500 to-blue-600',
  ];
  
  // Clean emoji/symbols out of name for initials hashing
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  
  let initials = '';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    initials = parts[0].substring(0, 2).toUpperCase();
  } else if (clean.length > 0) {
    initials = clean.substring(0, Math.min(2, clean.length)).toUpperCase();
  } else {
    // Fallback if name is purely symbols/emojis
    initials = name.substring(0, Math.min(2, name.length));
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;

  return {
    initials: initials || '?',
    gradient: colors[index]
  };
}

export default function ChatFeed({
  rooms,
  packets,
  contacts,
  selectedRoomId,
  onSelectRoom,
  decryptedCache,
  onDeleteRoom
}: ChatFeedProps) {

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center my-12 text-slate-500">
        <FileCode className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-400 font-mono">No Tunnels Provisioned</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          The secure stego console is empty. Add a new contact by phone/email or establish a group to start!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#111622] text-slate-100">
      {/* BBM Metallic Header Info */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#233045] bg-[#1a2336] shadow-sm">
        <h3 className="text-[10.5px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
          ACTIVE CHAT TUNNELS ({rooms.length})
        </h3>
        <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded bg-green-550 animate-pulse" /> BBM Node Ready
        </span>
      </div>
 
      {/* BlackBerry BBM style feed list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293c]/40 scrollbar-thin">
        {rooms.map((room) => {
          const isSelected = selectedRoomId === room.id;
          
          // Filter packets for this specific room
          const roomPackets = packets.filter(p => p.roomId === room.id);
          const lastPacket = roomPackets.slice(-1)[0];
          
          const isDecrypted = lastPacket ? !!decryptedCache[lastPacket.id] : false;
          const decryptedText = lastPacket ? decryptedCache[lastPacket.id] : '';
          const avatar = getAvatarProps(room.name);

          // Find contact associated if not group
          let contactInfo: Contact | undefined = undefined;
          if (!room.isGroup && room.memberIds && room.memberIds.length > 0) {
            contactInfo = contacts.find(c => c.id === room.memberIds![0]);
          }

          return (
            <button
              id={`room-item-${room.id}`}
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full text-left p-3.5 flex items-start gap-3 transition-all duration-150 relative cursor-pointer group ${
                isSelected
                  ? 'bg-[#1c263c] border-b border-t border-[#2e3e5b]/40 shadow-inner'
                  : 'hover:bg-[#1a2335]/50'
              }`}
            >
              {/* Profile Avatar with silver-metal ring */}
              <div className="relative text-center">
                <div className={`w-11 h-11 rounded-xl shrink-0 bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-slate-950 font-bold text-sm shadow-md border border-[#233045]`}>
                  {room.isGroup ? (
                    <Users className="w-5 h-5 text-slate-950" />
                  ) : (
                    avatar.initials
                  )}
                </div>
                {/* BlackBerry Red Notification Star (if last msg is locked) */}
                {lastPacket && !isDecrypted && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md border border-[#111622] animate-bounce">
                    ★
                  </span>
                )}
              </div>
 
              {/* Chat details */}
              <div className="flex-1 min-w-0 pr-1 select-none text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate pr-2 pointer-events-none">
                    {room.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono pointer-events-none">
                      {lastPacket ? lastPacket.timestamp : ''}
                    </span>
                    {onDeleteRoom && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete the chat room "${room.name}"? This will purge all associated messages.`)) {
                            onDeleteRoom(room.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-500/25 text-slate-400 hover:text-rose-400 rounded transition-colors pointer-events-auto cursor-pointer flex items-center justify-center"
                        title="Delete Chat Room"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtitle / phone or email info */}
                {contactInfo && (
                  <div className="text-[9px] text-slate-400 font-mono truncate leading-none mt-0.5">
                    {contactInfo.phone ? contactInfo.phone : contactInfo.email}
                  </div>
                )}
 
                {/* BBM Delivered/Read preview with signature status tag */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 pointer-events-none pr-1">
                  {lastPacket ? (
                    isDecrypted ? (
                      <>
                        {/* BBM 'R' status indicator (Blue icon badge for Read) */}
                        <span className="w-5 h-5 rounded bg-[#0080ff] text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm border border-blue-400/40 select-none">
                          R
                        </span>
                        <p className="truncate text-slate-300 font-medium font-sans">
                          {decryptedText}
                        </p>
                      </>
                    ) : (
                      <>
                        {/* BBM 'D' status indicator (Slate badge for Delivered) */}
                        <span className="w-5 h-5 rounded bg-[#334155] text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm border border-slate-500/30 select-none">
                          D
                        </span>
                        <div className="flex items-center gap-1 min-w-0">
                          <Lock className="w-3 h-3 text-amber-500/85 shrink-0" />
                          <span className="truncate italic text-slate-450 text-[11px] font-mono">
                            {lastPacket.filename}
                          </span>
                        </div>
                      </>
                    )
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">
                      No transmissions yet
                    </span>
                  )}
                </div>
 
                {/* Cover theme and bits indicator row */}
                <div className="flex items-center justify-between mt-2 pt-0.5">
                  <span className="text-[9px] font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20 uppercase shrink-0">
                    {room.isGroup ? 'Group' : 'Direct Call'}
                  </span>
                  {lastPacket && (
                    <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md border uppercase shrink-0 text-emerald-400 bg-emerald-500/10 border-emerald-500/25`}>
                      {lastPacket.bitLength} bits
                    </span>
                  )}
                </div>
              </div>
 
              {/* Selected indicator BBM blue glossy bar */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0080ff] shadow-[0_0_8px_#0080ff]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
