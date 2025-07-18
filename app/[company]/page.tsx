const sendMessage = async () => {
  if (!inputText.trim() || !assistantId || isLoading) return;

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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSend,
        assistantId,
        threadId: threadId || null,
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