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

  // Initialize - get assistant ID and start conversation
  useEffect(() => {
    const initializeDemo = async () => {
      try {
        // Get assistant ID for this company
        const response = await fetch(`/api/company-assistant?company=${encodeURIComponent(companySlug)}`);
        const data = await response.json();
        
        if (!data.success || !data.assistantId) {
          throw new Error(`No demo found for ${companySlug.replace(/-/g, ' ')}`);
        }
        
        setAssistantId(data.assistantId);
        
        // Start the conversation automatically with the opening message
        await startConversation(data.assistantId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demo');
        console.error('Initialization error:', err);
      } finally {
        setInitializing(false);
      }
    };

    if (companySlug) {
      initializeDemo();
    }
  }, [companySlug]);

  const startConversation = async (assistantIdToUse: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'START_CONVERSATION', // This should trigger the opening message
          assistantId: assistantIdToUse,
          threadId: null // Start new thread
        }),
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      
      // Add the assistant's opening message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages([assistantMessage]);
      setThreadId(data.threadId);
    } catch (err) {
      console.error('Start conversation error:', err);
      // If auto-start fails, just show empty chat - user can type first
    }
  };

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

      if (!response.ok) throw new Error('Failed to send message');

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
      console.error('Send message error:', err);
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error sending your message. Please try again.',
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

  // Loading state
  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-xl font-medium text-white mb-2">
            Loading {companySlug.replace(/-/g, ' ')} Demo...
          </h1>
          <p className="text-gray-400 text-sm">Setting up your personalized solar consultation</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-sm mx-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-white mb-4">Demo Not Found</h1>
          <p className="text-gray-400 mb-6 text-sm">{error}</p>
          <div className="space-y-2 text-xs text-gray-500">
            <p><strong>Company:</strong> {companySlug.replace(/-/g, ' ')}</p>
            <p><strong>URL:</strong> solarbookers.com/{companySlug}</p>
          </div>
        </div>
      </div>
    );
  }

  // iPhone-style SMS Demo Interface
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* iPhone Container */}
      <div className="w-full max-w-sm bg-black rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
        
        {/* iPhone Status Bar */}
        <div className="bg-black px-6 py-2 flex justify-between items-center text-white text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          </div>
          <div className="text-center font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center space-x-1">
            <div className="text-xs">100%</div>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-full h-full bg-green-500 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* SMS Header */}
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">S</span>
              </div>
              <div>
                <h1 className="text-white text-base font-medium">
                  {companySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h1>
                <p className="text-gray-400 text-xs">Active now</p>
              </div>
            </div>
            <div className="text-blue-400 text-sm">Details</div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-black h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 py-8 text-sm">
                <p>Send a message to start the demo...</p>
              </div>
            )}
            
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
                placeholder="iMessage"
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
  );
}