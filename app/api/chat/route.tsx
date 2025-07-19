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
    console.log('Environment check:', { 
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0 
    });

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
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log('Created thread:', currentThreadId);
    }
    
    // Validate thread ID before proceeding
    if (!currentThreadId) {
      console.error('Thread ID is still undefined after creation');
      return NextResponse.json(
        { error: 'Failed to create or get thread ID' },
        { status: 500 }
      );
    }
    
    console.log('Using thread ID:', currentThreadId);

    // Add user message to thread
    console.log('Adding message to thread:', currentThreadId);
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });

    // Create and run the assistant
    console.log('Creating run with assistant:', assistantId, 'on thread:', currentThreadId);
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    });
    console.log('Run created:', run.id);
    console.log('Run object:', { id: run.id, status: run.status, threadId: currentThreadId });

    // Wait for completion - THE FIX IS HERE
    let runStatus = run;
    let attempts = 0;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Attempt ${attempts + 1}: Status ${runStatus.status}, ThreadID: ${currentThreadId}, RunID: ${run.id}`);
      
      // Validate parameters before API call
      if (!currentThreadId || !run.id) {
        console.error('Missing parameters for run retrieval:', { currentThreadId, runId: run.id });
        throw new Error('Missing thread ID or run ID for status check');
      }
      
      // Only retrieve the latest status
      // @ts-ignore - OpenAI library typing issue
      const latestRun = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      runStatus = latestRun;
      attempts++;
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      const latestMessage = messages.data[0];
      
      if (latestMessage && latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        if (content && content.type === 'text') {
          console.log('SUCCESS! Response:', content.text.value);
          return NextResponse.json({
            success: true,
            response: content.text.value,
            threadId: currentThreadId
          });
        }
      }
    }

    console.error('Run failed with status:', runStatus.status);
    return NextResponse.json(
      { error: `Assistant run failed: ${runStatus.status}` },
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