import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for company slug -> assistant ID mapping
// Note: This resets when the server restarts, but works for testing
const companyAssistants = new Map<string, string>();

// Store assistant ID for a company slug
export async function POST(request: NextRequest) {
  try {
    const { companySlug, assistantId } = await request.json();
    
    if (!companySlug || !assistantId) {
      return NextResponse.json(
        { error: 'Company slug and assistant ID are required' },
        { status: 400 }
      );
    }

    // Store the mapping
    companyAssistants.set(companySlug, assistantId);
    
    return NextResponse.json({
      success: true,
      message: `Assistant ${assistantId} stored for company ${companySlug}`
    });
  } catch (error) {
    console.error('Error storing company assistant:', error);
    return NextResponse.json(
      { error: 'Failed to store assistant mapping' },
      { status: 500 }
    );
  }
}

// Get assistant ID for a company slug
export async function GET(request: NextRequest) {
  try {
    const companySlug = request.nextUrl.searchParams.get('company');
    
    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }

    const assistantId = companyAssistants.get(companySlug);
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'No assistant found for this company' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assistantId,
      companySlug
    });
  } catch (error) {
    console.error('Error retrieving company assistant:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve assistant mapping' },
      { status: 500 }
    );
  }
}