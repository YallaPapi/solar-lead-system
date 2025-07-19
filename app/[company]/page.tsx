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
          throw new Error(`Demo not available for company "${companySlug}". Error: ${data.error || 'Assistant not found'}`);
        }
        
        setAssistantId(data.assistantId);
        
        const openingMessage: Message = {
          id: 'opening',
          text: `It's Sarah from Solar Bookers here. Is this the same person that got a database reactivation quote from us in the last couple of months?`,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages([openingMessage]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demo');
      } finally {
        setInitializing(false);
      }
    };

    initializeDemo();
  }, [companySlug]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !assistantId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
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
          message: userMessage.text,
          assistantId,
          threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        text: 'Sorry, there was an error. Please try again.',
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

  const quickReplies = ['Yes, that was me', 'Not interested', 'Tell me more', 'How much?'];
  
  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    setTimeout(() => sendMessage(), 100);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Demo</h2>
          <p className="text-gray-600 text-sm">Setting up your conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-50 border-4 border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Demo Not Available</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{error}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 font-mono">
            <div className="mb-1"><span className="font-semibold">Expected:</span> https://solarbookers.com/test-solar</div>
            <div><span className="font-semibold">Current:</span> https://solarbookers.com/{companySlug}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Solar Bookers</h1>
              <p className="text-sm text-gray-600">Database Reactivation Specialist</p>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md ${message.sender === 'user' ? 'ml-16' : 'mr-16'}`}>
                  {message.sender === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2 ml-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">S</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Sarah</span>
                      <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className={`px-6 py-4 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-200'
                      : 'bg-white text-gray-800 shadow-gray-200 border border-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="text-right mt-1 mr-1">
                      <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md mr-16">
                  <div className="flex items-center space-x-2 mb-2 ml-1">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">S</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Sarah</span>
                    <span className="text-xs text-gray-500">typing...</span>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Replies */}
        {messages.length > 0 && !isLoading && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-medium shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex space-x-4 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl px-8 py-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed font-medium shadow-lg disabled:shadow-none"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Try These Responses</h3>
              <p className="text-sm text-gray-600">Test different scenarios to see how our AI handles various situations</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">"Yes, that was me"</p>
                    <p className="text-green-600 text-sm mt-1">See how we handle interested prospects</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">"Not interested"</p>
                    <p className="text-red-600 text-sm mt-1">Watch our objection handling process</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">$</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">"How much does it cost?"</p>
                    <p className="text-blue-600 text-sm mt-1">Experience our pricing conversation flow</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">#</span>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-800">"I have 5000 contacts"</p>
                    <p className="text-purple-600 text-sm mt-1">See our database assessment process</p>
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