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
    let thread;
    if (threadId) {
      thread = { id: threadId };
    } else {
      thread = await openai.beta.threads.create();
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Wait for completion with proper typing
    let runStatus: any = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const latestMessage = messages.data[0];
      
      if (latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        const responseText = content && 'text' in content 
          ? content.text.value 
          : 'Sorry, I had trouble responding.';

        return NextResponse.json({
          success: true,
          response: responseText,
          threadId: thread.id
        });
      }
    }

    return NextResponse.json(
      { error: 'Failed to get assistant response' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}