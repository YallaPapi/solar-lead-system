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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loading {companySlug.replace(/-/g, ' ')} Demo...
          </h1>
          <p className="text-gray-600">Setting up your personalized solar consultation</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Demo Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><strong>Company:</strong> {companySlug.replace(/-/g, ' ')}</p>
            <p><strong>URL:</strong> solarbookers.com/{companySlug}</p>
          </div>
        </div>
      </div>
    );
  }

  // SMS Demo Interface
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-semibold text-gray-800 text-center">
            {companySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - SMS Demo
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Experience our lead qualification process
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-120px)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <p>Send a message to start the demo...</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
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
              <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs">Sarah is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}