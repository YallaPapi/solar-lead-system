const sendMessage = async () => {
    if (!inputText.trim() || !assistantId || isLoading) return;

    console.log('=== FRONTEND SENDING MESSAGE ===');
    console.log('inputText:', inputText);
    console.log('assistantId:', assistantId);
    console.log('threadId:', threadId);
    console.log('threadId type:', typeof threadId);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText; // Store this before clearing
    setInputText('');
    setIsLoading(true);

    try {
      const payload = {
        message: messageToSend,
        assistantId,
        threadId: threadId || null, // Explicitly send null instead of undefined
      };
      
      console.log('Sending payload:', payload);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error('Network error');
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Make sure we're setting the threadId correctly
      if (data.threadId) {
        console.log('Setting threadId to:', data.threadId);
        setThreadId(data.threadId);
      }
      
    } catch (err) {
      console.error('Frontend error:', err);
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