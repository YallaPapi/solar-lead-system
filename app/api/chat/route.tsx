import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      response: "Hello! This is a test response.",
      receivedMessage: body.message || 'no message',
      threadId: 'test-thread-123'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Ultra simple API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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