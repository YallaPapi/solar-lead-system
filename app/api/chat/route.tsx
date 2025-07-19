import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('=== CHAT API START ===');
  
  try {
    // Check environment variables first
    if (!process.env.OPENAI_API_KEY) {
      console.error('MISSING OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { assistantId, message, threadId } = await request.json();
    console.log('Chat API called with:', { assistantId, message, threadId });

    if (!assistantId || !message) {
      console.error('Missing required fields:', { assistantId: !!assistantId, message: !!message });
      return NextResponse.json(
        { error: 'Assistant ID and message are required' },
        { status: 400 }
      );
    }

    // Create or use existing thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      console.log('Creating new thread...');
      try {
        const thread = await openai.beta.threads.create();
        if (!thread || !thread.id) {
          console.error('Thread creation failed - no ID returned:', thread);
          return NextResponse.json(
            { error: 'Failed to create conversation thread' },
            { status: 500 }
          );
        }
        currentThreadId = thread.id;
        console.log('Successfully created thread:', currentThreadId);
      } catch (createError) {
        console.error('Failed to create thread:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation thread' },
          { status: 500 }
        );
      }
    }
    
    // Final validation of thread ID
    if (!currentThreadId || typeof currentThreadId !== 'string') {
      console.error('Thread ID is invalid:', currentThreadId);
      return NextResponse.json(
        { error: 'Invalid thread ID' },
        { status: 500 }
      );
    }
    
    console.log('Using thread ID:', currentThreadId);

    // Add user message to thread
    console.log('Adding message to thread:', currentThreadId);
    try {
      await openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message
      });
      console.log('Message added successfully');
    } catch (messageError) {
      console.error('Failed to add message to thread:', messageError);
      return NextResponse.json(
        { error: 'Failed to add message to thread', threadId: currentThreadId },
        { status: 500 }
      );
    }

    // Create and run the assistant
    console.log('Creating run with assistant:', assistantId, 'on thread:', currentThreadId);
    let run;
    try {
      run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: assistantId
      });
      console.log('Run created:', run.id);
    } catch (runError) {
      console.error('Failed to create run:', runError);
      return NextResponse.json(
        { error: 'Failed to create assistant run', threadId: currentThreadId },
        { status: 500 }
      );
    }

    // Wait for completion with better error handling
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 30;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Attempt ${attempts + 1}: Status ${runStatus.status}`);
      
             try {
         // @ts-ignore - OpenAI SDK typing issue with retrieve method
         runStatus = await openai.beta.threads.runs.retrieve(
           currentThreadId,
           run.id
         );
         attempts++;
       } catch (retrieveError) {
        console.error('Failed to retrieve run status:', retrieveError);
        return NextResponse.json(
          { error: 'Failed to check run status', threadId: currentThreadId },
          { status: 500 }
        );
      }
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      try {
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const latestMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (latestMessage && latestMessage.content[0] && latestMessage.content[0].type === 'text') {
          console.log('SUCCESS! Response received');
          return NextResponse.json({
            success: true,
            response: latestMessage.content[0].text.value,
            threadId: currentThreadId
          });
        } else {
          console.error('No valid assistant response found');
          return NextResponse.json(
            { error: 'No valid response from assistant', threadId: currentThreadId },
            { status: 500 }
          );
        }
      } catch (messageRetrieveError) {
        console.error('Failed to retrieve messages:', messageRetrieveError);
        return NextResponse.json(
          { error: 'Failed to retrieve assistant response', threadId: currentThreadId },
          { status: 500 }
        );
      }
    }

    // Handle non-completed status
    console.error('Run failed with status:', runStatus.status);
    return NextResponse.json(
      { error: `Assistant run failed: ${runStatus.status}`, threadId: currentThreadId },
      { status: 500 }
    );

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Chat failed', details: errorMessage },
      { status: 500 }
    );
  }
}