import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { assistantId, message, threadId } = await request.json();

    if (!assistantId || !message) {
      return NextResponse.json(
        { error: 'Assistant ID and message are required' },
        { status: 400 }
      );
    }

    // Create or use existing thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });

    // Create and run the assistant
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    let attempts = 0;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      attempts++;
    }

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      const latestMessage = messages.data[0];
      
      if (latestMessage && latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        if (content && content.type === 'text') {
          return NextResponse.json({
            success: true,
            response: content.text.value,
            threadId: currentThreadId
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Assistant run failed' },
      { status: 500 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Chat failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat API is running',
    timestamp: new Date().toISOString()
  });
}