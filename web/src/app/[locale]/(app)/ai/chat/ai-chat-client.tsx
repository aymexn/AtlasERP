'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft,
  Paperclip,
  Mic,
  SendHorizontal,
  Sparkles,
  Loader2,
  Bot
} from 'lucide-react';
import { Link } from '@/navigation';
import { aiService, ChatMessage } from '@/services/ai';
import ChatMessageContent from './chat-messages';
import { useTranslations } from 'next-intl';

export default function AiChatClient() {
  const t = useTranslations('chat');

  const INITIAL_SUGGESTIONS = [
    t('suggestions.cash_flow'),
    t('suggestions.stock_shortage'),
    t('suggestions.client_performance')
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();

  // Initialize suggestions on mount or when translations load
  useEffect(() => {
    setSuggestions(INITIAL_SUGGESTIONS);
  }, [t]);

  // Clean typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Load chat history
  useEffect(() => {
    async function initChat() {
      setLoading(true);
      try {
        const history = await aiService.getChatHistory();
        setMessages(history || []);
        
        // Handle direct query from redirect if present
        const initialPrompt = searchParams.get('prompt');
        if (initialPrompt) {
          sendUserMessage(initialPrompt);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, [searchParams]);

  // Scroll to bottom on new messages or loading states
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Typing stream animation simulator
  const animateResponse = (fullText: string, messageId: string, apiSuggestions?: string[]) => {
    setIsSending(false); // Stop thinking state

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const newAssistantMsg: ChatMessage = {
      id: messageId || `res-ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newAssistantMsg]);

    const words = fullText.split(' ');
    let currentWordIdx = 0;
    let currentText = '';

    typingIntervalRef.current = setInterval(() => {
      if (currentWordIdx < words.length) {
        currentText += (currentWordIdx === 0 ? '' : ' ') + words[currentWordIdx];
        setMessages(prev => prev.map(m => 
          m.id === newAssistantMsg.id ? { ...m, content: currentText } : m
        ));
        currentWordIdx++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        // Dynamically update context-aware follow-up suggestion chips
        setSuggestions(apiSuggestions && apiSuggestions.length > 0 ? apiSuggestions : INITIAL_SUGGESTIONS);
      }
    }, 20); // Smooth fast typing
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    setInputValue('');
    setIsSending(true);
    setSuggestions([]); // Flush suggestions while responding

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await aiService.sendChatMessage(text);
      animateResponse(res.response, res.messageId, res.suggestions);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
      setSuggestions(INITIAL_SUGGESTIONS);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: t('error_connecting'),
        createdAt: new Date().toISOString()
      }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    sendUserMessage(inputValue);
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate speech-to-text input behavior
      setTimeout(() => {
        setInputValue(t('voice_sample'));
        setIsListening(false);
      }, 1500);
    } else {
      setIsListening(false);
    }
  };

  const handleAttachContext = () => {
    // Simulate attaching manufacturing or sales order context
    setInputValue(prev => prev + (prev ? " " : "") + t('attach_sample'));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 bg-white dark:bg-slate-950 rounded-3xl">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-sm font-black text-slate-450 uppercase tracking-widest animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[900px] bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/ai" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all">
            <ArrowLeft size={18} className="text-slate-500" />
          </Link>
          <div className="relative">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles size={16} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-150 tracking-tight">Atlas AI</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('status_online')}</p>
          </div>
        </div>
      </div>

      {/* Messages Window with strict scrolling Viewport Constraints */}
      <div className="flex-1 h-[calc(100vh-220px)] overflow-y-auto px-6 py-4 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 max-w-2xl mx-auto space-y-8 select-none">
            {/* Pulsing status ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-full border-2 border-indigo-500/30 flex items-center justify-center bg-white dark:bg-slate-950 shadow-xl">
                <div className="absolute inset-2 rounded-full border border-pink-500/20 animate-ping duration-1000" />
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Sparkles size={24} className="animate-spin-slow" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {t('title')}
              </h2>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse tracking-wide uppercase">
                {t('subtitle')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed mt-2 font-medium">
                {t('welcome_message')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end w-full">
                    <div className="bg-slate-900 text-white rounded-2xl rounded-tr-none shadow-md max-w-[75%] px-4 py-3 text-sm leading-relaxed">
                      <p>{msg.content}</p>
                      <span className="block text-[8px] mt-1.5 font-bold uppercase tracking-wider text-right text-white/50">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start w-full space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shrink-0 flex items-center justify-center text-white shadow-sm self-start mt-1">
                    <Bot size={14} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none max-w-[85%] px-5 py-4 text-sm leading-relaxed shadow-sm">
                    <ChatMessageContent content={msg.content} />
                    <span className="block text-[8px] mt-2 font-bold uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Pulse Loader for Thinking */}
            {isSending && (
              <div className="flex justify-start w-full space-x-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shrink-0 flex items-center justify-center text-white shadow-sm self-start">
                  <Bot size={14} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-805 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 justify-center items-center shadow-sm">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* sticky bottom block containing suggestions list and unified input block */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 space-y-4">
        {/* Dynamic Suggesions Action Chips Grid */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
            {suggestions.map((sugText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendUserMessage(sugText)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-full text-xs font-semibold cursor-pointer transform hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <span>💬</span>
                <span>{sugText}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar Unified Container */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all max-w-4xl mx-auto">
          <button
            type="button"
            onClick={handleAttachContext}
            title="Attacher la fiche de l'OF"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={handleVoiceInput}
            title={t('voice_tooltip')}
            className={`p-1 rounded-lg transition-colors ${
              isListening 
                ? 'text-rose-500 bg-rose-500/10 animate-pulse' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-355'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isSending}
            placeholder={isListening ? t('listening_placeholder') : t('input_placeholder')}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none py-1 px-1 text-sm font-medium text-slate-800 dark:text-slate-200 resize-none max-h-32 min-h-[28px] overflow-y-auto scrollbar-thin placeholder-slate-400 dark:placeholder-slate-500"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer shrink-0"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
