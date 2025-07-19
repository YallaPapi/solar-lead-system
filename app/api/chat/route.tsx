import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  console.log('=== CHAT API START ===');
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { assistantId, message, threadId, company, initialize } = await request.json();
    console.log('Chat API called with:', { assistantId, message, threadId, company, initialize });

    // Get assistant ID from company slug if not provided directly
    let finalAssistantId = assistantId;
    if (!finalAssistantId && company) {
      try {
        finalAssistantId = await redis.get(`company:${company}`);
        console.log(`Retrieved assistant ID ${finalAssistantId} for company ${company}`);
      } catch (error) {
        console.error('Error retrieving assistant from Redis:', error);
      }
    }

    if (!finalAssistantId) {
      return NextResponse.json({ error: 'Assistant ID or company is required' }, { status: 400 });
    }

    // For initialization calls, message can be empty
    if (!initialize && !message) {
      return NextResponse.json({ error: 'Message is required for non-initialization calls' }, { status: 400 });
    }

    // Create or use existing thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log('Created thread:', currentThreadId);
    }

    // Add user message to thread only if not initializing
    if (!initialize && message) {
      await openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message
      });
    }

    // Create run and immediately poll with a simplified approach
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: finalAssistantId
    });

    console.log('Run created:', run.id);

    // Simple polling approach - wait a bit then check messages
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get messages instead of checking run status
      try {
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        
        // Look for assistant response that's newer than our run
        const assistantMessages = messages.data.filter(msg => 
          msg.role === 'assistant' && 
          new Date(msg.created_at * 1000) > new Date(run.created_at * 1000)
        );

        if (assistantMessages.length > 0) {
          const latestMessage = assistantMessages[0];
          if (latestMessage.content[0] && latestMessage.content[0].type === 'text') {
            console.log('SUCCESS! Got response');
            return NextResponse.json({
              success: true,
              message: latestMessage.content[0].text.value,
              threadId: currentThreadId
            });
          }
        }
        
        attempts++;
      } catch (error) {
        console.error('Error checking messages:', error);
        attempts++;
      }
    }

    // If we get here, timeout
    return NextResponse.json({
      error: 'Response timeout - assistant is taking too long',
      threadId: currentThreadId
    }, { status: 500 });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      error: 'Chat failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}