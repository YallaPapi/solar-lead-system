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

    if (companySlug) {
      initializeDemo();
    }
  }, [companySlug]);

  const sendMessage = async () => {
    console.log('Send button clicked', { inputText: inputText.trim(), assistantId, isLoading });
    if (!inputText.trim() || !assistantId || isLoading) {
      console.log('Send message blocked:', { hasText: !!inputText.trim(), hasAssistant: !!assistantId, isLoading });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      console.log('Making chat API call with:', { messageToSend, assistantId, threadId });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          assistantId,
          threadId: threadId || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', { status: response.status, statusText: response.statusText, body: errorText });
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log('API Response Success:', data);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
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

  const companyName = companySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading database reactivation demo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Demo Not Available</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">
              <strong>Expected URL:</strong> https://solarbookers.com/test-solar<br/>
              <strong>Your URL:</strong> https://solarbookers.com/{companySlug}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Database Reactivation Demo</h1>
          <p className="text-gray-600">See how our AI assistant reengages dormant leads for {companyName} via text messaging</p>
        </div>

        {/* iPhone SMS Interface - CENTERED */}
        <div className="flex justify-center mb-8">
          <div className="w-80 bg-black rounded-[2.5rem] p-2 shadow-2xl">
            <div className="bg-black rounded-[2.25rem] overflow-hidden">
              
              {/* Status Bar */}
              <div className="bg-black px-6 py-2 flex justify-between items-center text-white text-sm">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                  </div>
                  <span className="ml-2 text-xs">Verizon</span>
                </div>
                <div className="text-white font-medium">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">100%</span>
                  <div className="w-6 h-3 border border-white rounded-sm">
                    <div className="w-full h-full bg-green-500 rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* SMS Header */}
              <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📱</span>
                    </div>
                    <div>
                      <h1 className="text-white text-base font-medium">+1 (555) 123-4567</h1>
                      <p className="text-gray-400 text-xs">Solar Bookers</p>
                    </div>
                  </div>
                  <div className="text-blue-400 text-sm">Details</div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-black h-96 flex flex-col">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-700 text-white rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className="text-xs opacity-60 mt-1">
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
                      <div className="bg-gray-700 text-white max-w-xs px-3 py-2 rounded-2xl rounded-bl-md">
                        <div className="flex items-center space-x-1">
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

                {/* Input Area */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center space-x-3 bg-gray-800 rounded-full px-4 py-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Text Message"
                      disabled={isLoading}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || isLoading}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Instructions */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Test the AI Assistant</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-blue-800">Try: "yes" or "yeah"</p>
                <p className="text-blue-600 text-xs">See how it responds to interest</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="font-medium text-green-800">Try: "not interested"</p>
                <p className="text-green-600 text-xs">Watch it handle objections</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="font-medium text-purple-800">Try: "how much does it cost?"</p>
                <p className="text-purple-600 text-xs">See pricing objection handling</p>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <p className="font-medium text-orange-800">Try: "I have 5000 contacts"</p>
                <p className="text-orange-600 text-xs">Watch database assessment</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}