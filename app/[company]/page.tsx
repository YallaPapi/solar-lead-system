'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CompanyPage() {
  const params = useParams();
  const company = params?.company as string;
  
  // Format company name for display
  const formatCompanyName = (name: string) => {
    if (!name) return 'Solar Advisor';
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (company) {
      const openingMessage: Message = {
        role: 'assistant',
        content: `Hey this is Sarah from ${formatCompanyName(company)}. Is this the same person that got a database reactivation quote from us in the last couple of months?`,
        timestamp: new Date()
      };
      setMessages([openingMessage]);
    }
  }, [company]);

  // Remove the startConversation function since we're showing the message immediately

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          threadId: threadId,
          company: company
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* iPhone Frame */}
      <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: '375px', height: '812px' }}>
        {/* iPhone Screen */}
        <div className="bg-black rounded-[2.5rem] overflow-hidden relative h-full">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl z-50" 
               style={{ width: '154px', height: '32px' }}></div>
          
          {/* Screen Content */}
          <div className="bg-white h-full flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            
            {/* Status Bar */}
            <div className="flex justify-between items-center px-6 pt-12 pb-2 bg-white">
              <div className="text-black font-semibold text-sm">9:41</div>
              <div className="flex items-center space-x-1">
                <div className="text-black text-sm">●●●</div>
                <div className="text-black text-sm">📶</div>
                <div className="text-black text-sm">🔋</div>
              </div>
            </div>

            {/* Messages Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <div className="text-blue-500 text-lg">‹</div>
              <div className="flex flex-col items-center">
                <div className="text-black font-semibold text-lg">{formatCompanyName(company)}</div>
                <div className="text-gray-500 text-xs">Active now</div>
              </div>
              <div className="text-blue-500 text-lg">🔄</div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-2 bg-white">
              {messages.map((message, index) => (
                <div key={index} className={`flex mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-xs px-4 py-2 text-base leading-tight ${
                      message.role === 'user'
                        ? 'text-white rounded-2xl rounded-br-md'
                        : 'text-black rounded-2xl rounded-bl-md'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' ? '#007AFF' : '#E9E9EB',
                      borderRadius: '18px',
                      borderBottomRightRadius: message.role === 'user' ? '5px' : '18px',
                      borderBottomLeftRadius: message.role === 'assistant' ? '5px' : '18px',
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div 
                    className="px-4 py-2 rounded-2xl rounded-bl-md"
                    style={{
                      backgroundColor: '#E9E9EB',
                      borderRadius: '18px',
                      borderBottomLeftRadius: '5px',
                    }}
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="text-gray-400 text-xl">📷</div>
                <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2" style={{ backgroundColor: '#F2F2F7' }}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="iMessage"
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-base text-black placeholder-gray-500"
                  />
                  {inputMessage.trim() && (
                    <button
                      onClick={sendMessage}
                      disabled={isLoading}
                      className="ml-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: '#007AFF' }}
                    >
                      ↑
                    </button>
                  )}
                </div>
                <div className="text-gray-400 text-xl">🎤</div>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="flex justify-center pb-2 bg-white">
              <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}