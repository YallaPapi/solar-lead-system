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
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hi! I'm here to help you learn about solar options for ${company}. What questions do you have about solar energy?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
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
    <div className="flex flex-col h-screen bg-white font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
      {/* iPhone-style header */}
      <div className="flex items-center justify-center h-11 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-black">{company || 'Solar Advisor'}</h1>
      </div>

      {/* Messages container - iPhone Messages style */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-white">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex mb-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-3xl text-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-lg'
                  : 'bg-gray-200 text-black rounded-bl-lg'
              }`}
              style={{
                backgroundColor: message.role === 'user' ? '#007AFF' : '#E5E5EA',
                color: message.role === 'user' ? '#FFFFFF' : '#000000',
                borderRadius: '22px',
                borderBottomRightRadius: message.role === 'user' ? '8px' : '22px',
                borderBottomLeftRadius: message.role === 'assistant' ? '8px' : '22px',
                fontSize: '17px',
                lineHeight: '1.4',
                padding: '8px 16px'
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-1">
            <div 
              className="px-4 py-2 rounded-3xl bg-gray-200 rounded-bl-lg"
              style={{
                backgroundColor: '#E5E5EA',
                borderRadius: '22px',
                borderBottomLeftRadius: '8px',
                padding: '8px 16px'
              }}
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* iPhone-style input bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-2">
        <div 
          className="flex items-center space-x-2 rounded-full border border-gray-300 px-4 py-2"
          style={{
            backgroundColor: '#F2F2F7',
            borderRadius: '25px',
            border: 'none',
            minHeight: '44px'
          }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="iMessage"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-500"
            style={{
              fontSize: '17px',
              color: '#000000'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor: inputMessage.trim() ? '#007AFF' : '#C4C4C6',
              fontSize: '16px'
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}