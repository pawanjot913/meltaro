import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../api';
import { SITE_CONTENT } from '../mockData';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function SupportChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! Mello here, your fluffy woodland companion! 🌲 Welcome to Meltaro. I can recommend coffee pairings, tell you about our 36-hour sourdough, or guide you through car-hop delivery. What is your heart desiring today? ✨" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "Recommend a pairing",
    "Explain Car-Hop service",
    "Do you have gluten free?",
    "Where are you located?"
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Build brief local history
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const data = await sendChatMessage(userMsg, historyPayload);
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Oh dear! I lost my connection for a second beneath the pines. 🌲 Let me brew a fresh cup and please try asking me again! ☕"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary-container text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 flex items-center gap-2 group border border-tertiary-fixed-dim/20 cursor-pointer"
        title="Chat with Mello"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary-fixed-dim"></span>
        </span>
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out font-sans text-xs font-bold uppercase tracking-wider">
          Mello Chat
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-surface-variant z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="forest-gradient px-6 py-4 flex items-center justify-between border-b border-surface-variant/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={SITE_CONTENT.mascotUrl}
                  alt="Mello"
                  className="w-10 h-10 rounded-full bg-white/20 p-1 object-cover border border-tertiary-fixed-dim/30"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif text-lg font-bold text-white">Mello</h4>
                  <Sparkles className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
                </div>
                <p className="text-[10px] text-on-primary-container font-sans font-medium tracking-wide">Meltaro Barista & Guide</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-container-low no-scrollbar">
            {messages.map((m, idx) => {
              const isModel = m.role === 'model';
              return (
                <div
                  key={idx}
                  className={`flex ${isModel ? 'justify-start' : 'justify-end'} items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200`}
                >
                  {isModel && (
                    <img
                      src={SITE_CONTENT.mascotUrl}
                      alt="Mello"
                      className="w-7 h-7 rounded-full bg-white object-cover border border-surface-variant/30 flex-shrink-0 mb-1"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs font-sans leading-relaxed shadow-sm ${
                      isModel
                        ? 'bg-white text-on-background rounded-bl-none border border-surface-container'
                        : 'bg-primary text-white rounded-br-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start items-center gap-2 animate-pulse">
                <img
                  src={SITE_CONTENT.mascotUrl}
                  alt="Mello"
                  className="w-7 h-7 rounded-full bg-white object-cover border border-surface-variant/30 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-surface-container flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 border-t border-surface-variant/30 bg-surface-container-lowest flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-3 py-1.5 bg-surface-container hover:bg-primary/5 hover:text-primary rounded-full text-[10px] font-semibold text-on-surface-variant transition-all border border-surface-variant/50 cursor-pointer active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-surface-variant/30 bg-white flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask Mello anything..."
              className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-container disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
