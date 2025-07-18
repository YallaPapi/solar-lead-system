import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { assistantId, message, threadId } = await request.json();

    console.log('Chat request received:', { assistantId, message, threadId });

    if (!assistantId || !message) {
      console.error('Missing required fields:', { assistantId: !!assistantId, message: !!message });
      return NextResponse.json(
        { error: 'Assistant ID and message are required' },
        { status: 400 }
      );
    }

    // Create or use existing thread
    let thread;
    if (threadId) {
      console.log('Using existing thread:', threadId);
      thread = { id: threadId };
    } else {
      console.log('Creating new thread...');
      thread = await openai.beta.threads.create();
      console.log('Created new thread:', thread.id);
    }

    // Handle special START_CONVERSATION message
    if (message === 'START_CONVERSATION') {
      console.log('Handling START_CONVERSATION...');
      
      try {
        // Create a run to get the assistant's opening message
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistantId,
        });

        // Wait for completion
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max
        
        while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          attempts++;
        }

        if (runStatus.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];
          
          if (lastMessage && lastMessage.content[0]?.type === 'text') {
            console.log('START_CONVERSATION success');
            return NextResponse.json({
              success: true,
              response: lastMessage.content[0].text.value,
              threadId: thread.id
            });
          }
        }

        console.log('START_CONVERSATION run failed, status:', runStatus.status);
      } catch (startError) {
        console.error('START_CONVERSATION error:', startError);
      }

      // Fallback message
      console.log('Using fallback opening message');
      return NextResponse.json({
        success: true,
        response: "It's Sarah from Solar Bookers here. Is this the same John Doe that got a Solar services quote from us in the last couple of months?",
        threadId: thread.id
      });
    }

    // Add user message to thread
    console.log('Adding user message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });

    // Run the assistant
    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Wait for completion with timeout
    console.log('Waiting for run completion...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      console.log(`Run status: ${runStatus.status}, attempt: ${attempts}`);
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      console.log('Getting assistant response...');
      const messages = await openai.beta.threads.messages.list(thread.id);
      const latestMessage = messages.data[0];
      
      if (latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        const responseText = content && 'text' in content 
          ? content.text.value 
          : 'Sorry, I had trouble responding.';

        console.log('Chat success, response length:', responseText.length);
        return NextResponse.json({
          success: true,
          response: responseText,
          threadId: thread.id
        });
      }
    } else {
      console.error('Run failed with status:', runStatus.status);
      if (runStatus.last_error) {
        console.error('Run error details:', runStatus.last_error);
      }
    }

    return NextResponse.json(
      { error: `Assistant run failed with status: ${runStatus.status}` },
      { status: 500 }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}