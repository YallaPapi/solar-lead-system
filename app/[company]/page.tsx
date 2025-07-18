const sendMessage = async () => {
  if (!inputText.trim() || !assistantId || isLoading) return;

  console.log('=== SENDING MESSAGE ===');
  console.log('Input text:', inputText);
  console.log('Assistant ID:', assistantId);
  console.log('Thread ID:', threadId);

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
    console.log('Making API call to /api/chat...');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: inputText,
        assistantId,
        threadId,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API response data:', data);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: data.response,
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setThreadId(data.threadId);
    
  } catch (err) {
    console.error('=== SEND MESSAGE ERROR ===');
    console.error('Error:', err);
    
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