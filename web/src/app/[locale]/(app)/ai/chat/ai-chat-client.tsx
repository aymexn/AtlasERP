'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Paperclip,
  Mic,
  SendHorizontal,
  Sparkles,
  Loader2,
  Bot,
  Trash2,
  Copy,
  Plus,
  BookOpen,
  X,
  Check,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Link } from '@/navigation';
import { aiService, ChatMessage } from '@/services/ai';
import ChatMessageContent from './chat-messages';
import { useTranslations } from 'next-intl';

interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  suggestions: string[];
  createdAt: string;
}

export default function AiChatClient() {
  const t = useTranslations('chat');
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  const INITIAL_SUGGESTIONS = [
    t('suggestions.cash_flow'),
    t('suggestions.stock_shortage'),
    t('suggestions.client_performance')
  ];

  // Conversation history in LocalStorage
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Panels
  const [showPromptLib, setShowPromptLib] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();

  // Initialize suggestions on mount
  useEffect(() => {
    setSuggestions(INITIAL_SUGGESTIONS);
  }, [t]);

  // Clean typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Load Saved Conversations from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('atlas_ai_conversations');
        if (stored) {
          const parsed = JSON.parse(stored) as SavedConversation[];
          setConversations(parsed);
          if (parsed.length > 0) {
            // Load the most recent conversation
            const sorted = [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setCurrentConvId(sorted[0].id);
            setMessages(sorted[0].messages);
            setSuggestions(sorted[0].suggestions.length > 0 ? sorted[0].suggestions : INITIAL_SUGGESTIONS);
          } else {
            startNewSession();
          }
        } else {
          startNewSession();
        }
      } catch (err) {
        console.error('Failed to load conversations from localStorage:', err);
        startNewSession();
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Handle URL redirect query parameter (if any)
  useEffect(() => {
    const initialPrompt = searchParams?.get('prompt');
    if (initialPrompt && !loading) {
      sendUserMessage(initialPrompt);
    }
  }, [searchParams, loading]);

  // Auto-save active conversation to list and LocalStorage
  useEffect(() => {
    if (loading || !currentConvId || typingIntervalRef.current) return;

    const updatedConvs = conversations.map(c => {
      if (c.id === currentConvId) {
        // Generate a title if placeholder
        let title = c.title;
        if (title === 'Nouvelle Session' || title === 'New Session') {
          const firstUserMsg = messages.find(m => msgRole(m) === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return {
          ...c,
          title,
          messages,
          suggestions
        };
      }
      return c;
    });

    // If active conv is not in list (newly created), add it
    const exists = conversations.some(c => c.id === currentConvId);
    if (!exists && currentConvId) {
      const firstUserMsg = messages.find(m => msgRole(m) === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
        : (locale === 'ar' ? 'جلسة جديدة' : locale === 'en' ? 'New Session' : 'Nouvelle Session');

      updatedConvs.push({
        id: currentConvId,
        title,
        messages,
        suggestions,
        createdAt: new Date().toISOString()
      });
    }

    setConversations(updatedConvs);
    localStorage.setItem('atlas_ai_conversations', JSON.stringify(updatedConvs));
  }, [messages, suggestions, currentConvId]);

  // Helper for type-safe message role checks
  const msgRole = (msg: ChatMessage) => msg.role;

  // Scroll to bottom on new messages
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

  const startNewSession = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    const newId = `conv-${Date.now()}`;
    setCurrentConvId(newId);
    setMessages([]);
    setSuggestions(INITIAL_SUGGESTIONS);
    setShowPromptLib(false);
  };

  const loadSession = (id: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConvId(id);
      setMessages(conv.messages);
      setSuggestions(conv.suggestions.length > 0 ? conv.suggestions : INITIAL_SUGGESTIONS);
      setShowPromptLib(false);
    }
  };

  const deleteSession = (id: string) => {
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    localStorage.setItem('atlas_ai_conversations', JSON.stringify(remaining));

    if (currentConvId === id) {
      if (remaining.length > 0) {
        loadSession(remaining[0].id);
      } else {
        startNewSession();
      }
    }
  };

  const clearAllHistory = () => {
    setConversations([]);
    localStorage.removeItem('atlas_ai_conversations');
    startNewSession();
    setShowDeleteConfirm(false);
  };

  // Typing stream animation simulator
  const animateResponse = (fullText: string, messageId: string, apiSuggestions?: string[]) => {
    setIsSending(false);

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
        
        // Batch updates cleanly using atomic functional primitives
        setMessages(prev => prev.map(m => 
          m.id === newAssistantMsg.id ? { ...m, content: currentText } : m
        ));
        currentWordIdx++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        // ONLY set suggestions once typing has completely finished to avoid the infinite render loop!
        const finalSuggestions = apiSuggestions && apiSuggestions.length > 0 ? apiSuggestions : INITIAL_SUGGESTIONS;
        setSuggestions(finalSuggestions);
      }
    }, 15);
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    setInputValue('');
    setIsSending(true);
    setSuggestions([]); // Flush suggestions while loading

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const tempUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Construct request history payload
    const historyPayload = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await aiService.sendChatMessage(text, historyPayload);
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
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert(locale === 'ar' 
          ? "التعرف على الصوت غير مدعوم في متصفحك." 
          : "La reconnaissance vocale n'est pas supportée dans votre navigateur.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      
      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setInputValue(speechToText);
      };
      
      recognition.start();
    }
  };

  const handleAttachContext = () => {
    setInputValue(prev => prev + (prev ? " " : "") + t('attach_sample'));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Prompts Library Database
  const promptLibrary = [
    {
      category: locale === 'ar' ? 'المالية والمبيعات' : locale === 'en' ? 'Finance & Sales' : 'Finance & Ventes',
      prompts: [
        { label: "Analyser le Cash Flow", text: "Analyser le Cash Flow de ce mois" },
        { label: "Factures en retard", text: "Lister les factures en retard et clients débiteurs" },
        { label: "Performance CA", text: "Comparer le chiffre d'affaires mensuel actuel par rapport à l'objectif de vente" }
      ]
    },
    {
      category: locale === 'ar' ? 'المخزون واللوجستيات' : locale === 'en' ? 'Stocks & Logistics' : 'Stocks & Logistique',
      prompts: [
        { label: "Vérifier Ruptures Stocks", text: "Vérifier les risques de rupture de stock sur les produits actifs" },
        { label: "Produits en surstock", text: "Lister les produits avec un niveau de stock excessif" }
      ]
    },
    {
      category: locale === 'ar' ? 'الإنتاج والتصنيع' : locale === 'en' ? 'Production & MO' : 'Production & OF',
      prompts: [
        { label: "OF en cours", text: "Quels sont les ordres de fabrication (OF) actuellement actifs et leur état ?" },
        { label: "Analyses de coûts", text: "Lister les coûts des dernières matières premières" }
      ]
    }
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] max-h-[900px] bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl relative select-none">
      
      {/* 1. Left Sidebar: Chat History */}
      <div className="hidden md:flex flex-col w-64 bg-[#0F1B2D] text-slate-300 border-r border-slate-800 flex-shrink-0">
        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
          >
            <Plus size={16} />
            {t('new_session')}
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-bold uppercase tracking-wider">
              {locale === 'ar' ? 'لا توجد جلسات' : locale === 'en' ? 'No Sessions' : 'Aucune session'}
            </div>
          ) : (
            [...conversations]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((conv) => {
                const isActive = conv.id === currentConvId;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#1D2E49] text-white font-extrabold shadow-inner' 
                        : 'hover:bg-[#15233A] text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => loadSession(conv.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare size={14} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvToDelete(conv.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                      title="Supprimer la conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer actions */}
        {conversations.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-[#0A1220]">
            <button
              onClick={() => {
                setConvToDelete(null);
                setShowDeleteConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:text-white hover:bg-red-950/20 rounded-lg text-xs font-bold transition-all"
            >
              <Trash2 size={14} />
              {locale === 'ar' ? 'حذف السجل بالكامل' : locale === 'en' ? 'Clear All History' : 'Effacer l\'historique'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Link href="/ai" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all md:hidden">
              <ArrowLeft size={18} className="text-slate-500" />
            </Link>
            <div className="relative">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles size={16} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 dark:text-slate-150 tracking-tight">Atlas AI</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('status_online')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptLib(!showPromptLib)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                showPromptLib
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <BookOpen size={14} />
              {locale === 'ar' ? 'مكتبة الأسئلة' : locale === 'en' ? 'Prompt Library' : 'Librairie Prompts'}
            </button>
          </div>
        </div>

        {/* Messages Scrolling Container */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 max-w-xl mx-auto space-y-8 select-none">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
                <div className="relative h-20 w-20 rounded-full border-2 border-blue-500/30 flex items-center justify-center bg-white dark:bg-slate-950 shadow-xl">
                  <div className="absolute inset-2 rounded-full border border-indigo-500/20 animate-ping duration-1000" />
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {t('title')}
                </h2>
                <p className="text-xs font-black text-blue-600 dark:text-blue-450 tracking-wide uppercase">
                  {t('subtitle')}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed mt-2 font-medium">
                  {t('welcome_message')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg) => {
                const isUser = msgRole(msg) === 'user';
                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end w-full">
                      <div className="bg-[#0F1B2D] text-white rounded-2xl rounded-tr-none shadow-md max-w-[75%] px-4 py-3 text-sm leading-relaxed font-semibold">
                        <p>{msg.content}</p>
                        <span className="block text-[8px] mt-1.5 font-black uppercase tracking-wider text-right text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-start w-full space-x-3 group/msg">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                      <Bot size={14} />
                    </div>
                    <div className="relative bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none max-w-[85%] px-5 py-4 text-sm leading-relaxed shadow-sm transition-all">
                      
                      {/* Copy response text */}
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="absolute right-3 top-3 opacity-0 group-hover/msg:opacity-100 p-1.5 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 rounded-lg transition-all shadow-sm"
                        title="Copier le message"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>

                      <ChatMessageContent content={msg.content} />
                      <span className="block text-[8px] mt-2 font-black uppercase tracking-wider text-right text-slate-400 dark:text-slate-500 select-none">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Thinking loader */}
              {isSending && (
                <div className="flex justify-start w-full space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shrink-0 flex items-center justify-center text-white shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 justify-center items-center shadow-sm">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Library side drawer Overlay */}
        {showPromptLib && (
          <div className="absolute right-0 top-[69px] bottom-[150px] w-80 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl p-4 flex flex-col z-20 overflow-y-auto animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <span className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                {locale === 'ar' ? 'المطالبات الجاهزة' : 'Prompts suggérés'}
              </span>
              <button onClick={() => setShowPromptLib(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={14} />
              </button>
            </div>
            
            <div className="flex-1 space-y-5 py-4">
              {promptLibrary.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {category.category}
                  </h3>
                  <div className="space-y-1.5">
                    {category.prompts.map((p, pidx) => (
                      <button
                        key={pidx}
                        onClick={() => {
                          sendUserMessage(p.text);
                          setShowPromptLib(false);
                        }}
                        className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-850/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                      >
                        <span>{p.label}</span>
                        <ChevronRight size={12} className="text-slate-350 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 space-y-4">
          
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto select-none">
              {suggestions.map((sugText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendUserMessage(sugText)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/80 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-full text-xs font-bold cursor-pointer transform hover:-translate-y-0.5 transition-all shadow-sm active:scale-95"
                >
                  <span>💬</span>
                  <span>{sugText}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all max-w-4xl mx-auto shadow-sm">
            <button
              type="button"
              onClick={handleAttachContext}
              title={t('attach_tooltip')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={handleVoiceInput}
              title={t('voice_tooltip')}
              className={`p-1.5 rounded-lg transition-all ${
                isListening 
                  ? 'text-rose-500 bg-rose-500/10 animate-pulse ring-2 ring-rose-300' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Mic className="w-4 h-4" />
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
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-blue-500/20 active:scale-95"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Delete/Clear History Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {locale === 'ar' ? 'هل أنت متأكد؟' : 'Confirmer la suppression'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
              {convToDelete 
                ? (locale === 'ar' ? 'سيتم حذف هذه المحادثة نهائياً.' : 'Voulez-vous vraiment supprimer cette conversation ?')
                : (locale === 'ar' ? 'سيتم حذف جميع المحادثات نهائياً.' : 'Voulez-vous vraiment effacer tout votre historique de chat ?')}
            </p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConvToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                {locale === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={() => {
                  if (convToDelete) {
                    deleteSession(convToDelete);
                  } else {
                    clearAllHistory();
                  }
                  setShowDeleteConfirm(false);
                  setConvToDelete(null);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all"
              >
                {locale === 'ar' ? 'حذف' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
