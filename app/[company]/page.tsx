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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Solar Bookers</h1>
                <p className="text-sm text-gray-600">SMS Lead Reactivation Demo for {formatCompanyName(company)}</p>
              </div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <span className="text-green-700 font-medium text-sm">✨ Live Demo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Side - Demo Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-2xl">{formatCompanyName(company).charAt(0)}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{formatCompanyName(company)}</h2>
                <p className="text-blue-600 font-medium">SMS Lead Reactivation System</p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🤖 How It Works</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    This SMS agent automatically reaches out to your old leads with personalized messages. 
                    It engages them in natural conversation and works to book appointments for your sales team.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-green-900 mb-2">💬 Try It Out</h3>
                  <p className="text-green-800 text-sm leading-relaxed">
                    <strong>Act like a customer!</strong> Respond to Sarah's message on the phone. 
                    Try different responses like "Yes, that was me" or "Tell me more" to see how the AI handles various scenarios.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Responses to Try:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">"Yes, that was me"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">"Not interested"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">"How much does it cost?"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">"Tell me more"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - iPhone Demo */}
          <div className="flex justify-center">
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
        </div>
      </div>
    </div>
  );
}