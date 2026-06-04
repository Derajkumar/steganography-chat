import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, Cpu, Code, HelpCircle, Download, FileSpreadsheet, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatPacket } from '../types';

interface CssInspectorProps {
  packet: ChatPacket | null;
  onDecrypted: (id: string, text: string) => void;
}

export default function CssInspector({ packet, onDecrypted }: CssInspectorProps) {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'bits'>('visual');

  // Clear states when packet selection changes
  useEffect(() => {
    setErrorText(null);
    setSuccessText(null);
    setPasscode('');
  }, [packet]);

  if (!packet) {
    return (
      <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[500px]">
        <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-400 font-mono">No Stylesheet Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
          Select any CSS packet from the feed to dissect its bits, inspect its design rules, or decrypt its contents.
        </p>
      </div>
    );
  }

  // Parses EOL steganography to represent them in token lists
  const tokenizeStego = () => {
    const text = packet.cssContent;
    const tokens: { lineIndex: number; charIndex: number; type: '0' | '1' | 'normal'; context: string }[] = [];
    
    // Find each semicolon and examine the next character
    let lineNum = 1;
    let occurrences = 0;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        lineNum++;
      }
      
      if (text[i] === ';') {
        occurrences++;
        if (i + 1 < text.length) {
          const next = text[i + 1];
          const prevContext = text.substring(Math.max(0, i - 12), i);
          
          if (next === ' ') {
            tokens.push({
              lineIndex: lineNum,
              charIndex: i,
              type: '0',
              context: prevContext + `;`
            });
          } else if (next === '\t') {
            tokens.push({
              lineIndex: lineNum,
              charIndex: i,
              type: '1',
              context: prevContext + `;`
            });
          } else {
            // Normal semicolon with no stego space/tab
            if (occurrences % 15 === 0) { // Keep list sampled and readable
              tokens.push({
                lineIndex: lineNum,
                charIndex: i,
                type: 'normal',
                context: prevContext + `;`
              });
            }
          }
        }
      }
    }
    return tokens;
  };

  const tokens = tokenizeStego();
  const hiddenBitsCount = tokens.filter(t => t.type !== 'normal').length;

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const response = await fetch('/api/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: packet.id,
          passcode: passcode.trim()
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to decrypt packet.');
      }

      const val = await response.json();
      setSuccessText(val.decryptedText);
      onDecrypted(packet.id, val.decryptedText);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Incorrect passcode');
    } finally {
      setLoading(false);
    }
  };

  // Extract variables for visualizer block rendering
  const getMatrixCells = () => {
    // Generate up to 54 grid cells dynamically modeled by the stylesheet
    const cells = [];
    let colorVar1 = '#3b82f6';
    let colorVar2 = '#ff007f';
    
    if (packet.coverStyle === 'cyber-neon') {
      colorVar1 = '#00f0ff';
      colorVar2 = '#ff007f';
    } else if (packet.coverStyle === 'terminal-green') {
      colorVar1 = '#22c55e';
      colorVar2 = '#15803d';
    } else if (packet.coverStyle === 'sunset-pulse') {
      colorVar1 = '#f59e0b';
      colorVar2 = '#ec4899';
    }

    for (let i = 0; i < 54; i++) {
      const r = Math.floor(Math.sin(i * 0.1) * 127 + 128);
      const g = Math.floor(Math.cos(i * 0.2) * 127 + 128);
      const b = Math.floor(Math.sin(i * 0.3 + 1) * 127 + 128);
      
      const rotation = (i * 12) % 360;
      const opacity = ((i * 3) % 45 + 55) / 100;
      const color = i % 2 === 0 ? colorVar1 : colorVar2;
      
      cells.push({
        index: i,
        rgb: `rgb(${r},${g},${b})`,
        color,
        opacity,
        rotation,
      });
    }

    return cells;
  };

  const cells = getMatrixCells();

  return (
    <div id={`inspector-${packet.id}`} className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full">
      
      {/* Header Info */}
      <div className="p-5 border-b border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
              Packet Dissection
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              ID: #{packet.id}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-200 font-mono mt-1">
            {packet.filename}
          </h3>
          <p className="text-xs text-slate-400">
            Source Origin: <span className="text-slate-300 font-semibold">{packet.sender}</span> • Theme Preset:{' '}
            <span className="text-indigo-400 capitalize">{packet.coverStyle.replace('-', ' ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={packet.cssUrl}
            download={packet.filename}
            className="px-3 py-1.5 rounded-lg text-[10px] bg-white/10 hover:bg-white/20 border border-white/5 transition-colors uppercase font-bold tracking-wider text-slate-200 font-mono flex items-center gap-1.5"
            title="Download Raw CSS File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20 px-4">
        <button
          onClick={() => setActiveTab('visual')}
          className={`px-4 py-3 font-mono text-xs tracking-wider border-b-2 font-bold uppercase transition-all ${
            activeTab === 'visual'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          🎨 CSS Sandbox Render
        </button>
        <button
          onClick={() => setActiveTab('bits')}
          className={`px-4 py-3 font-mono text-xs tracking-wider border-b-2 font-bold uppercase transition-all ${
            activeTab === 'bits'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          🔬 Stego Matrix ({hiddenBitsCount})
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-3 font-mono text-xs tracking-wider border-b-2 font-bold uppercase transition-all ${
            activeTab === 'code'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          📄 Raw Code
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-5 min-h-[300px] overflow-y-auto">
        {activeTab === 'visual' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  Styles in Sandbox wrapper block
                </h4>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                  REAL DIRECT STYLING
                </div>
              </div>

              {/* Dynamic Sandbox Scoped render */}
              <div
                className={`p-6 rounded-xl border relative transition-all duration-300 overflow-hidden ${
                  packet.coverStyle === 'cyber-neon'
                    ? 'bg-[#0d0e15] border-[#ff007f]/50 shadow-[0_0_12px_rgba(255,0,127,0.15)] text-white'
                    : packet.coverStyle === 'terminal-green'
                    ? 'bg-[#020617] border-[#4ade80]/60 text-[#4ade80]'
                    : 'bg-gradient-to-br from-[#1e1b4b] to-[#311042] border-indigo-500/30 text-[#ffedd5]'
                }`}
              >
                {/* Visual Cover styles applied */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 font-mono tracking-wider block mb-1">
                        Rendered cover mockup style
                      </span>
                      <h4 className="text-lg font-bold">
                        {packet.coverStyle === 'cyber-neon'
                          ? 'Cyber Neon Engine active'
                          : packet.coverStyle === 'terminal-green'
                          ? 'C:\\OPERATOR\\STAGE'
                          : 'Sunset Horizon Ambient'}
                      </h4>
                    </div>
                    <div className="text-[11px] font-mono text-right p-1.5 rounded bg-slate-800/40 border border-slate-700/35">
                      {packet.bitLength} Bits Hidden
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-700/50 my-2" />

                  {/* Generative Colored Blocks representation of the loaded CSS variables */}
                  <span className="text-xs font-mono text-slate-400 block mb-2">
                    Visual Steganography Variable Map Grid
                  </span>
                  <div className="grid grid-cols-9 gap-1.5">
                    {cells.map((cell) => (
                      <div
                        key={cell.index}
                        className="aspect-square rounded-md transition-all duration-300 transform hover:scale-110 border border-slate-950/20"
                        style={{
                          backgroundColor: cell.color,
                          opacity: cell.opacity,
                          transform: `rotate(${cell.rotation}deg)`,
                        }}
                        title={`Cell ${cell.index} Colored via --cell-color: ${cell.color}`}
                      />
                    ))}
                  </div>

                  {packet.hint && (
                    <div className="p-2.5 bg-slate-950/60 rounded-lg text-xs font-mono border border-slate-800 text-slate-300 leading-normal">
                      🗝️ <strong>Note:</strong> {packet.hint}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS Plain Source */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>css_payload_source.css ({packet.cssContent.length} bytes)</span>
              <span>All semicolons function as standard styling lines</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-auto max-h-[300px] border border-slate-900 whitespace-pre scrollbar-thin">
              {packet.cssContent}
            </div>
          </div>
        )}

        {/* Whitespace Bit Analyzer */}
        {activeTab === 'bits' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/70 text-xs text-slate-300 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-slate-200">How did we encode the bits in CSS?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                By scanning each semicolon <code className="text-cyan-400 font-bold bg-cyan-950/50 px-1 py-0.5 rounded">;</code>, our parser extracts the trailing whitespace character.
                The browser ignore whitespaces after semicolons, making this stego invisible in normal operation:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Semicolon + Space (`; `)</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded font-bold uppercase text-[9px]">
                    Bit 0
                  </span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Semicolon + Tab (`;\t`)</span>
                  <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded font-bold uppercase text-[9px]">
                    Bit 1
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Steganography Bit Sequence Board</span>
                <span>{hiddenBitsCount} total bits found</span>
              </div>

              {/* Grid of parsed bit tokens */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[10px] bg-slate-950/20 p-3 rounded-xl border border-slate-800 max-h-[220px] overflow-y-auto">
                {tokens.map((token, id) => {
                  const isZero = token.type === '0';
                  const isOne = token.type === '1';
                  
                  return (
                    <div
                      key={id}
                      className={`p-2 rounded border font-mono flex items-center justify-between ${
                        isZero
                          ? 'bg-cyan-950/15 border-cyan-900/40 text-cyan-400'
                          : isOne
                          ? 'bg-pink-950/15 border-pink-900/40 text-pink-400'
                          : 'bg-slate-950 border-slate-900 text-slate-500'
                        }`}
                    >
                      <span className="text-[9px]">L{token.lineIndex}</span>
                      <span className="text-slate-500 truncate max-w-[100px] text-right font-semibold">
                        ...{token.context}
                      </span>
                      {isZero ? (
                        <span className="font-bold text-[10px] bg-cyan-500/15 px-1 rounded">0 (space)</span>
                      ) : isOne ? (
                        <span className="font-bold text-[10px] bg-pink-500/15 px-1 rounded">1 (tab)</span>
                      ) : (
                        <span className="text-slate-600">No bits</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decryption Controls (Sticky bottom) */}
      <div className="p-5 border-t border-white/5 bg-black/40 font-sans mt-auto">
        {successText ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                Symmetric Decrypt Success!
              </span>
              <p className="text-sm font-medium text-slate-100 break-words leading-relaxed selection:bg-emerald-800">
                {successText}
              </p>
            </div>
            <button
              id="clear-decryption-cache-btn"
              onClick={() => setSuccessText(null)}
              className="text-slate-400 hover:text-white text-xs font-mono border border-white/10 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Lock
            </button>
          </div>
        ) : (
          <form onSubmit={handleDecrypt} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="decrypt-passcode-input"
                  type="password"
                  required
                  placeholder="Enter symmetric passcode to unlock..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
                <Lock className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
              </div>
              <button
                id="submit-decrypt-btn"
                type="submit"
                disabled={loading || !passcode.trim()}
                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-[1px] shadow-lg shadow-amber-400/10"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin text-slate-950" /> : null}
                <span>Extract & Decrypt Payload</span>
              </button>
            </div>
            {errorText && (
              <p className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorText}</span>
              </p>
            )}
          </form>
        )}
      </div>

    </div>
  );
}
