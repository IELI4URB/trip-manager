'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  MapPin,
  Utensils,
  Shield,
  Luggage,
  Calendar,
  CreditCard,
  Smartphone,
  Car,
  Plane,
  Clock,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  trip: any;
  onClose: () => void;
  onUpdate: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'generate_itinerary', label: 'Generate Itinerary', icon: Calendar, color: 'bg-blue-500' },
  { id: 'visa_requirements', label: 'Visa Checklist', icon: Shield, color: 'bg-green-500' },
  { id: 'packing_checklist', label: 'Packing List', icon: Luggage, color: 'bg-purple-500' },
  { id: 'food_guide', label: 'Food Guide', icon: Utensils, color: 'bg-orange-500' },
  { id: 'country_apps', label: 'Essential Apps', icon: Smartphone, color: 'bg-cyan-500' },
  { id: 'safety_guide', label: 'Safety Info', icon: Shield, color: 'bg-red-500' },
  { id: 'shopping_guide', label: 'Shopping Guide', icon: CreditCard, color: 'bg-pink-500' },
  { id: 'jet_lag_plan', label: 'Jet Lag Plan', icon: Clock, color: 'bg-indigo-500' },
];

const CHAT_SUGGESTIONS = [
  "What should I do today?",
  "What's the weather like?",
  "Best time to visit attractions?",
  "Where should I eat nearby?",
  "Is metro better than taxi?",
  "Do I need cash here?",
  "What are the rush hours?",
  "Any safety concerns?",
];

export default function AIAssistant({ trip, onClose, onUpdate }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'chat'>('actions');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load chat history
    loadChatHistory();
  }, [trip.id]);

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai?type=chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.chats) {
          setMessages(
            data.chats.map((chat: any) => ({
              role: chat.role,
              content: chat.content,
              timestamp: new Date(chat.createdAt),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const executeAction = async (actionId: string) => {
    setLoadingAction(actionId);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionId,
          data: {
            nationality: 'US', // This should come from user settings
          },
        }),
      });

      if (!res.ok) throw new Error('AI request failed');

      const result = await res.json();
      
      toast.success(getSuccessMessage(actionId));
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const sendMessage = async (message?: string) => {
    const text = message || input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          data: {
            message: text,
            history: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const result = await res.json();
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white">AI Travel Assistant</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your personal travel companion for {trip.destination}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'actions'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Quick Actions
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'actions' ? (
            <div className="p-4 h-full overflow-y-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Let AI help you plan your trip. Click any action to generate personalized recommendations.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isActionLoading = loadingAction === action.id;
                  return (
                    <button
                      key={action.id}
                      onClick={() => executeAction(action.id)}
                      disabled={!!loadingAction}
                      className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all text-left ${
                        isActionLoading ? 'opacity-75' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                        {isActionLoading ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                          {action.label}
                        </p>
                        {isActionLoading && (
                          <p className="text-xs text-slate-500">Generating...</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Additional info */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
                <h3 className="font-medium text-violet-800 dark:text-violet-200 mb-2">
                  💡 AI-Powered Features
                </h3>
                <ul className="text-sm text-violet-600 dark:text-violet-300 space-y-1">
                  <li>• Optimized daily itineraries avoiding crowds</li>
                  <li>• Real-time flight & weather monitoring</li>
                  <li>• Smart packing lists based on destination</li>
                  <li>• Safety alerts and local tips</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Ask me anything about your trip to {trip.destination}!
                    </p>
                    
                    {/* Suggestions */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {CHAT_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => sendMessage(suggestion)}
                          className="px-3 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900 dark:hover:text-primary-300 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-primary-200' : 'text-slate-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-sm text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your trip..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getSuccessMessage(actionId: string): string {
  switch (actionId) {
    case 'generate_itinerary':
      return 'Itinerary generated! Check the Activities section.';
    case 'visa_requirements':
      return 'Visa checklist created! Check the Visa section.';
    case 'packing_checklist':
      return 'Packing list generated! Check the Essentials section.';
    case 'food_guide':
      return 'Food recommendations added! Check the Food section.';
    case 'country_apps':
      return 'App recommendations added! Check the Apps section.';
    case 'safety_guide':
      return 'Safety information added! Stay safe!';
    case 'shopping_guide':
      return 'Shopping guide generated!';
    case 'jet_lag_plan':
      return 'Jet lag plan created! Adjust your sleep early.';
    default:
      return 'AI suggestions generated successfully!';
  }
}
