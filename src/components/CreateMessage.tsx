import React, { useState } from 'react';
import { Send, Lock, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

interface CreateMessageProps {
  onSuccess: () => void;
}

export default function CreateMessage({ onSuccess }: CreateMessageProps) {
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [passcode, setPasscode] = useState('stego123');
  const [hint, setHint] = useState('');
  const [theme, setTheme] = useState('cyber-neon');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Approximate bit sizing calculation based on characters
  const getPayloadSize = () => {
    if (!message) return 0;
    return Math.max(0, message.length * 16 + 144);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender.trim() || !message.trim() || !passcode.trim()) {
      setErrorStatus('Please fill in Name, Message, and Secret Passcode fields.');
      return;
    }

    setLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: sender.trim(),
          message: message.trim(),
          passcode: passcode.trim(),
          theme,
          hint: hint.trim() || `Key: "${passcode.substring(0, Math.min(2, passcode.length))}..."`
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected the message packet.');
      }

      // Success
      setMessage('');
      setHint('');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Network error while transmitting CSS packet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-left pb-10">
      <div className="p-3 bg-[#1f2c34] rounded-xl border border-white/5 space-y-1">
        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
          🛡️ Covert Semicolon Splicing
        </span>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          This wizard encrypts your text with AES-256 block-cipher encryption and injects bits trailing standard CSS semicolons. Perfect for high-grade stego files!
        </p>
      </div>

      {errorStatus && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-mono">
          ⚠️ {errorStatus}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sender */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            Sender Nickname
          </label>
          <input
            id="input-sender"
            type="text"
            required
            placeholder="e.g., Alice, AgentX"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full bg-[#202c33] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Secure Key */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            Secret Passcode (AES-256 Symmetric Key)
          </label>
          <div className="relative">
            <input
              id="input-passcode"
              type={showKey ? 'text' : 'password'}
              required
              placeholder="Key required to decrypt"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-[#202c33] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500" />
            <button
              id="toggle-passcode-visibility"
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3.5 top-3.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title={showKey ? 'Hide passcode' : 'Show passcode'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex justify-between font-bold">
            <span>Secret Message Payload</span>
            <span className="text-[9px] text-emerald-400 font-bold lowercase">
              ~{getPayloadSize()} bits required
            </span>
          </label>
          <textarea
            id="input-message"
            required
            rows={4}
            placeholder="Write secret message... Hidden trailing whitespace bits are generated behind CSS semicolons (spaces represent 0, tabs represent 1)."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-[#202c33] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Decryption Hint */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            Public Clue or Hint <span className="text-slate-500 font-normal italic">(Optional)</span>
          </label>
          <input
            id="input-hint"
            type="text"
            placeholder="e.g. Default code is stego123, etc."
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            className="w-full bg-[#202c33] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Choose CSS Template */}
        <div className="pt-1.5">
          <ThemeSelector selectedTheme={theme} onChange={setTheme} />
        </div>

        {/* Action Button */}
        <div className="pt-3">
          <button
            id="submit-stego-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-950 bg-[#00a884] hover:bg-[#00c298] shadow-lg shadow-emerald-500/10 active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5 font-mono text-[10.5px]">
                <span className="animate-spin inline-block border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4" />
                Infiltrating Stylesheet Math...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Inject & Broadcast Packet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
