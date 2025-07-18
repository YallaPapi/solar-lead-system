import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { assistantId, message, threadId } = await request.json();

    console.log('=== CHAT API START ===');
    console.log('assistantId:', assistantId);
    console.log('message:', message);
    console.log('threadId:', threadId);

    // Basic validation
    if (!assistantId || !message) {
      console.log('ERROR: Missing required fields');
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

    // For now, return a simple hardcoded response to test
    console.log('Returning hardcoded response for testing...');
    return NextResponse.json({
      success: true,
      response: "Thank goodness, my calendar just pinged me to call, but I didn't want to disturb you, are you still looking for help?",
      threadId: currentThreadId
    });

    /* COMMENTED OUT OPENAI CALL FOR NOW - UNCOMMENT WHEN BASIC TEST WORKS
    
    // Add user message to thread
    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });

    // Create run
    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    });

    console.log('Run created:', run.id);

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    let attempts = 0;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < 20) {
      console.log(`Run status: ${runStatus.status}, attempt: ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      attempts++;
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      const latestMessage = messages.data[0];
      
      if (latestMessage && latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        if (content && content.type === 'text') {
          console.log('SUCCESS: Got assistant response');
          return NextResponse.json({
            success: true,
            response: content.text.value,
            threadId: currentThreadId
          });
        }
      }
    }

    console.log('ERROR: Run did not complete successfully');
    return NextResponse.json(
      { error: 'Assistant run failed' },
      { status: 500 }
    );
    
    */

  } catch (error) {
    console.error('=== CHAT API ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Chat API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}