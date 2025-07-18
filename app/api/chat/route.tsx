import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { assistantId, message, threadId } = await request.json();
    console.log('Chat API called with:', { assistantId, message, threadId });

    if (!assistantId || !message) {
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
    } else {
      console.log('Using existing thread:', currentThreadId);
    }

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

    // Wait for completion - FIXED: Use correct thread and run IDs
    let runStatus = run;
    let attempts = 0;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Attempt ${attempts + 1}: Checking run ${run.id} on thread ${currentThreadId}`);
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      attempts++;
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      const latestMessage = messages.data[0];
      
      if (latestMessage && latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        if (content && content.type === 'text') {
          console.log('Success! Assistant responded:', content.text.value);
          return NextResponse.json({
            success: true,
            response: content.text.value,
            threadId: currentThreadId
          });
        }
      }
    }

    console.error('Assistant run failed with status:', runStatus.status);
    if (runStatus.status === 'failed') {
      console.error('Run failure details:', runStatus.last_error);
    }
    
    return NextResponse.json(
      { error: 'Assistant run failed', status: runStatus.status },
      { status: 500 }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed', details: error.message },
      { status: 500 }
    );
  }
}