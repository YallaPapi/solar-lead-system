import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current domain from the request
    const host = request.headers.get('x-vercel-forwarded-host') || 
                 request.headers.get('x-forwarded-host') ||
                 request.headers.get('host') || 
                 'localhost:3000';
    
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const currentDomain = `${protocol}://${host}`;
    
    console.log('Test demo creation with domain:', currentDomain);
    
    // Call the create-prototype endpoint with the correct domain
    const response = await fetch(`${currentDomain}/api/create-prototype`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Solar Company',
        contactName: 'John Doe',
        contactEmail: 'john@testcompany.com',
        location: 'Austin, TX',
        domain: host, // Pass the current domain explicitly
      }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test demo created successfully',
      currentDomain,
      result: data
    });

  } catch (error) {
    console.error('Test demo creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create test demo', details: error },
      { status: 500 }
    );
  }
} 