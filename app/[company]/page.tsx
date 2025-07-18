'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function CompanyDemoPage() {
  const params = useParams();
  const companySlug = params.company as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeDemo = async () => {
      try {
        const response = await fetch(`/api/company-assistant?company=${encodeURIComponent(companySlug)}`);
        const data = await response.json();
        
        if (!data.success || !data.assistantId) {
          throw new Error(`Demo not available`);
        }
        
        setAssistantId(data.assistantId);
        
        const openingMessage: Message = {
          id: 'opening',
          text: `Hi! I'm Sarah from Solar Bookers. Is this the same person that requested a solar consultation from us recently?`,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages([openingMessage]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consultation');
      } finally {
        setInitializing(false);
      }
    };

    if (companySlug) {
      initializeDemo();
    }
  }, [companySlug]);

  const sendMessage = async () => {
    if (!inputText.trim() || !assistantId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          assistantId,
          threadId,
        }),
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setThreadId(data.threadId);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const companyName = companySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-md">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Preparing Your Consultation
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Setting up personalized solar solutions for<br />
              <span className="font-semibold text-gray-800">{companyName}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">⚠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Consultation Unavailable</h1>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Premium Glass Card Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Elegant Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>
            <div className="relative px-8 py-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <span className="text-white text-xl font-bold">☀</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{companyName}</h1>
                  <p className="text-white/80 text-sm font-medium">Solar Energy Consultation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-[500px] flex flex-col">
            
            {/* Chat Messages */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`px-5 py-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-white/90 backdrop-blur-sm text-gray-800 shadow-md border border-gray-100'
                      } ${message.sender === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                    </div>
                    <p className={`text-xs mt-2 px-2 ${
                      message.sender === 'user' ? 'text-gray-500 text-right' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[75%]">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-800 shadow-md border border-gray-100 px-5 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">Sarah is typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Input Area */}
            <div className="p-6 bg-white/60 backdrop-blur-sm border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 disabled:opacity-50 shadow-sm font-medium placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Subtle Branding */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 font-medium">
            Powered by <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent font-bold">Solar Bookers</span>
          </p>
        </div>
      </div>
    </div>
  );
}