import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/src/lib/i18n';
import { Business } from '@/src/types';
import { callAIChat, getBusinessById } from '@/src/lib/supabase';
import {
  MessageCircle,
  X,
  Sparkles,
  Send,
  RotateCcw,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface ChatWidgetProps {
  onNavigate: (path: string) => void;
  allBusinesses?: Business[];
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  businessIds?: string[];
  businesses?: Business[];
  isError?: boolean;
}

const INITIAL_SUGGESTIONS = [
  'Best restaurants near me',
  'Doctor on Hospital Road',
  'Open now 24/7 pharmacy',
  'Bijli wala electrician mistri',
];

export function ChatWidget({ onNavigate, allBusinesses = [] }: ChatWidgetProps) {
  const { t, isUrdu } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: isUrdu
        ? 'السلام علیکم! میں "صادق آباد گائیڈ" ہوں۔ آپ مجھ سے شہر کے کسی بھی ہسپتال، ڈاکٹر، ریسٹورنٹ، الیکٹریشن یا دکان کے بارے میں پوچھ سکتے ہیں۔'
        : "Assalam-o-Alaikum! I'm your Sadiqabad AI Guide. Ask me for recommendations on doctors, restaurants, plumbers, mechanics, or shops across Sadiqabad.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    if (text.length > 300) {
      setRateLimitError('Message cannot exceed 300 characters');
      return;
    }

    setRateLimitError(null);
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // Build history for API
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await callAIChat(text, historyPayload, isUrdu ? 'ur' : 'en');

      if (res.error) {
        setRateLimitError(res.error);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: res.error || 'Notice: AI Guide is active once deployed on Netlify.',
            isError: true,
          },
        ]);
        return;
      }

      // Resolve business objects
      let candidateBusinesses: Business[] = [];
      if (res.business_ids && res.business_ids.length > 0) {
        candidateBusinesses = allBusinesses.filter((b) => res.business_ids.includes(b.id));
        if (candidateBusinesses.length === 0) {
          // Attempt async fetch for any missing IDs
          const fetched = await Promise.all(
            res.business_ids.slice(0, 3).map((id) => getBusinessById(id))
          );
          candidateBusinesses = fetched.filter(Boolean) as Business[];
        }
      }

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer || (isUrdu ? 'آپ کی رہنمائی کے لیے حاضر ہوں۔' : 'Here are the listings found in Sadiqabad:'),
        businessIds: res.business_ids,
        businesses: candidateBusinesses,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Live AI conversation connects upon Netlify deployment. You can browse all verified listings in the directory.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: isUrdu
          ? 'نئی چیٹ شروع ہو گئی۔ میں آپ کی کیا مدد کر سکتا ہوں؟'
          : 'Started a fresh conversation. What can I help you find in Sadiqabad?',
      },
    ]);
    setRateLimitError(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Sadiqabad AI Guide' : 'Open Sadiqabad AI Guide'}
          className={`flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full font-bold text-sm shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-slate-900/20'
              : 'bg-gradient-to-r from-teal-600 via-teal-500 to-amber-500 text-white hover:shadow-teal-500/30 hover:-translate-y-0.5 ring-4 ring-teal-500/20'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <div className="relative">
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="hidden sm:inline">Sadiqabad Guide</span>
              <span className="sm:hidden text-xs">AI Guide</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Glass Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 sm:bottom-24 right-3 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[560px] max-h-[80vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Sparkles className="w-4 h-4 fill-teal-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>Sadiqabad Guide</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-500/30 text-teal-200 rounded-md border border-teal-400/20">
                    AI
                  </span>
                </h4>
                <p className="text-[11px] text-teal-200/80">
                  Verified Local Business Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Start a new chat"
                className="p-1.5 rounded-xl hover:bg-white/10 text-teal-200 hover:text-white transition-colors"
                aria-label="New chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-teal-200 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-xs font-medium shadow-sm'
                      : m.isError
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-bl-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs sm:text-[13px]">{m.content}</p>
                </div>

                {/* Inline Business Cards if recommendations returned */}
                {m.businesses && m.businesses.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[95%]">
                    {m.businesses.map((biz) => (
                      <div
                        key={biz.id}
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate(`/business/${biz.id}`);
                        }}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-soft-sm hover:shadow-soft-md hover:border-teal-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 truncate">
                            {biz.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{biz.address}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>★ {biz.rating}</span>
                            <span>•</span>
                            <span>{biz.phone || 'No phone'}</span>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 max-w-[120px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] font-medium">Finding...</span>
              </div>
            )}

            {/* Suggestion Chips */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_SUGGESTIONS.map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(sugg)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] transition-colors text-left"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rate limit warning banner */}
          {rateLimitError && (
            <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{rateLimitError}</span>
            </div>
          )}

          {/* Input Box Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                maxLength={300}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isUrdu ? 'اپنا سوال یا تلاش لکھیں...' : 'Ask Sadiqabad Guide...'}
                className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white shadow-md shadow-teal-600/20 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
              <span>{inputValue.length}/300 chars</span>
              <span>Netlify AI Gateway • gpt-4o-mini</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
