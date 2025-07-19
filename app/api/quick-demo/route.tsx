import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use the domain detection utility
    const { getCurrentDomain } = await import('../../../lib/domain-utils');
    const currentDomain = getCurrentDomain(request);
    
    // Create a fresh demo
    const response = await fetch(`${currentDomain}/api/create-prototype`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Working Solar Co',
        contactName: 'Test User',
        contactEmail: 'test@workingsolar.com',
        location: 'Austin, TX'
      }),
    });

    const data = await response.json();
    
    if (data.success && data.url) {
      // Return HTML with clickable link - using proper Response syntax
      return new Response(
        `<html>
          <body style="font-family: Arial; padding: 20px;">
            <h2>✅ Fresh Demo Created!</h2>
            <p><strong>Demo URL:</strong></p>
            <p><a href="${data.url}" target="_blank" style="font-size: 18px; color: blue;">${data.url}</a></p>
            <p><strong>Company:</strong> Working Solar Co</p>
            <p><strong>Assistant ID:</strong> ${data.assistantId}</p>
            <hr>
            <p>Click the link above to test the chat functionality!</p>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    } else {
      return new Response(
        `<html>
          <body style="font-family: Arial; padding: 20px;">
            <h2>❌ Demo Creation Failed</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

  } catch (error) {
    return new Response(
      `<html>
        <body style="font-family: Arial; padding: 20px;">
          <h2>❌ Error</h2>
          <pre>${error}</pre>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
} 