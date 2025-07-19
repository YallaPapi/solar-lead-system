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
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Demo Not Available</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
            Expected: https://solarbookers.com/test-solar<br/>
            Current: https://solarbookers.com/{companySlug}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">S</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Solar Bookers</h1>
            <p className="text-sm text-gray-500">Database Reactivation Demo</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-sm px-4 py-2 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white ml-12'
                : 'bg-gray-100 text-gray-900 mr-12'
            }`}>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg mr-12">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex space-x-2 overflow-x-auto">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600 mb-3">
          <strong>Try responding with:</strong>
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-green-100 rounded text-green-800">
            "Yes, that was me" → Interest handling
          </div>
          <div className="text-center p-2 bg-red-100 rounded text-red-800">
            "Not interested" → Objection handling
          </div>
          <div className="text-center p-2 bg-blue-100 rounded text-blue-800">
            "How much?" → Pricing conversation
          </div>
          <div className="text-center p-2 bg-purple-100 rounded text-purple-800">
            "I have 5000 contacts" → Database assessment
          </div>
        </div>
      </div>
    </div>
  );
}