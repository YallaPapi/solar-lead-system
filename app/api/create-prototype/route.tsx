import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate clean company slug
function generateCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/\b(llc|inc|incorporated|corp|corporation|ltd|limited|co|company)\b/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, description } = await request.json();

    if (!companyName || !description) {
      return NextResponse.json(
        { error: 'Company name and description are required' },
        { status: 400 }
      );
    }

    // Generate clean company slug
    const companySlug = generateCompanySlug(companyName);

    // Create OpenAI assistant with personalized instructions
    const assistant = await openai.beta.assistants.create({
      name: `${companyName} Lead Qualifier`,
      instructions: `You are a friendly lead qualification assistant for ${companyName}. 

Company Description: ${description}

Your role is to:
1. Warmly greet potential customers
2. Ask qualifying questions about their solar needs:
   - Property type (residential/commercial)
   - Current monthly electric bill
   - Roof condition and age
   - Homeowner status
   - Timeline for installation
3. Gauge their interest level and budget
4. If they seem qualified, encourage them to book a consultation
5. Always maintain a helpful, professional tone
6. End conversations by directing them to schedule: calendly.com/${companySlug}

Keep responses conversational and brief for SMS format.`,
      model: 'gpt-4o-mini',
      tools: []
    });

    // Store the assistant mapping using the company-assistant API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://solarbookers.com';
    const storeResponse = await fetch(`${baseUrl}/api/company-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companySlug,
        assistantId: assistant.id,
        companyName,
        description
      }),
    });

    if (!storeResponse.ok) {
      console.error('Failed to store assistant mapping:', await storeResponse.text());
      // Don't fail the entire request, but log the error
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      companySlug,
      companyName,
      demoUrl: `${baseUrl}/${companySlug}`,
      calendlyUrl: `https://calendly.com/${companySlug}`
    });

  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant prototype' },
      { status: 500 }
    );
  }
}