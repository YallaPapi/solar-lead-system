import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('=== CHAT API CALLED ===');
  console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { assistantId, message, threadId } = body;

    console.log('Extracted values:', { assistantId, message, threadId });

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
    } else {
      console.log('Using existing thread:', currentThreadId);
    }

    // Add user message to thread
    console.log('Adding user message to thread...');
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });
    console.log('Message added successfully');

    // Create and run the assistant
    console.log('Creating run with assistant:', assistantId);
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    });
    console.log('Run created:', run.id, 'Status:', run.status);

    // Wait for completion
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 30;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      console.log(`Attempt ${attempts + 1}: Run status is ${runStatus.status}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      attempts++;
    }

    console.log(`Final run status after ${attempts} attempts:`, runStatus.status);

    if (runStatus.status === 'completed') {
      console.log('Run completed successfully, fetching messages...');
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      console.log('Messages retrieved, count:', messages.data.length);
      
      const latestMessage = messages.data[0];
      console.log('Latest message role:', latestMessage?.role);
      
      if (latestMessage && latestMessage.role === 'assistant') {
        const content = latestMessage.content[0];
        console.log('Message content type:', content?.type);
        
        if (content && content.type === 'text') {
          const response = content.text.value;
          console.log('Assistant response:', response);
          
          return NextResponse.json({
            success: true,
            response: response,
            threadId: currentThreadId
          });
        } else {
          console.error('Content is not text type:', content);
          return NextResponse.json(
            { error: 'Assistant response is not text' },
            { status: 500 }
          );
        }
      } else {
        console.error('Latest message is not from assistant');
        return NextResponse.json(
          { error: 'No assistant response found' },
          { status: 500 }
        );
      }
    } else if (runStatus.status === 'failed') {
      console.error('Run failed:', runStatus.last_error);
      return NextResponse.json(
        { error: 'Assistant run failed', details: runStatus.last_error },
        { status: 500 }
      );
    } else {
      console.error('Unexpected run status:', runStatus.status);
      return NextResponse.json(
        { error: `Assistant run failed. Status: ${runStatus.status}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('=== CHAT API ERROR ===');
    console.error('Error message:', error.message);
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
      return NextResponse.json(
        { 
          error: 'OpenAI API Error',
          details: error.message
        },
        { status: error.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Chat failed', details: error.message },
      { status: 500 }
    );
  }
}