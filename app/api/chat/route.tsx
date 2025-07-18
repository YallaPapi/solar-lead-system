# Create the ultra-simple version
$newChatAPI = @'
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ULTRA SIMPLE CHAT TEST ===');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    return NextResponse.json({
      success: true,
      response: "Hello! This is a test response.",
      receivedMessage: body.message || 'no message',
      threadId: 'test-thread-123'
    });

  } catch (error) {
    console.error('Ultra simple error:', error);
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
'@

# Write to file
$newChatAPI | Out-File -FilePath "app/api/chat/route.tsx" -Encoding UTF8