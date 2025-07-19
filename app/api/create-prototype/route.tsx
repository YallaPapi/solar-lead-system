import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FIXED: Use exact same slug generator as n8n workflow
function createCompanySlug(companyName: string): string {
  return (companyName || 'demo').toLowerCase()
    .replace(/\b(llc|inc|corp|ltd|co)\b/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // FIXED: Handle n8n workflow field mappings exactly as they're sent
    let name, email, organization_name, title, city, state, organization_short_description, industry;
    let client_company_name, client_website, service_type;

    // FIXED: Check for exact n8n field names from the workflow
    if (body.companyName || body.contactName || body.contactEmail) {
      // Current test format (companyName, contactName, contactEmail)
      name = body.contactName || 'Prospect';
      email = body.contactEmail || '';
      organization_name = body.companyName || '';
      title = body.title || '';
      city = body.location ? body.location.split(',')[0]?.trim() : '';
      state = body.location ? body.location.split(',')[1]?.trim() : '';
      organization_short_description = body.organization_short_description || '';
      industry = body.industry || '';
      
      client_company_name = 'Solar Bookers';
      client_website = 'https://solarbookers.com';
      service_type = 'Solar installation and consultation services';
    } else {
      // FIXED: Handle n8n actual workflow format (organization_name, lead_email, name)
      name = body.name || (body.contactName || 'Prospect').split(' ')[0];
      email = body.lead_email || body.email || body.contactEmail || '';
      organization_name = body.organization_name || body.companyName || '';
      title = body.title || '';
      city = body.city || (body.location ? body.location.split(',')[0]?.trim() : '');
      state = body.state || (body.location ? body.location.split(',')[1]?.trim() : '');
      organization_short_description = body.organization_short_description || '';
      industry = body.industry || '';
      client_company_name = body.client_company_name || 'Solar Bookers';
      client_website = body.client_website || 'https://solarbookers.com';
      service_type = body.service_type || "Solar installation and consultation services";
    }

    console.log('Processed fields:', { name, organization_name, client_company_name, client_website });

    // Validate required fields
    if (!organization_name) {
      return NextResponse.json(
        { error: 'Company name (organization_name or companyName) is required' },
        { status: 400 }
      );
    }

    // Set defaults if missing
    if (!name) name = 'Prospect';
    if (!client_company_name) client_company_name = 'Solar Bookers';
    if (!client_website) client_website = 'https://solarbookers.com';

    // Generate dynamic calendar link based on client company name
    const companySlug = createCompanySlug(organization_name);
    const dynamicCalendarLink = `https://calendly.com/${companySlug}`;

    // Create the assistant
    const assistant = await openai.beta.assistants.create({
      name: `${organization_name} Solar Consultation Assistant`,
      instructions: `You are a professional solar energy consultant helping ${organization_name} explore solar installation options. Your job is to qualify leads and schedule solar consultations. You use a consultative, educational approach to build trust and guide prospects through their solar journey.

###
PROSPECT INFORMATION:
- Name: ${name}
- Company: ${organization_name}
- Title: ${title || 'Not specified'}
- Location: ${city ? `${city}, ${state}` : state || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Company Description: ${organization_short_description || 'Not available'}
###

Your Communication Style: Professional yet approachable, educational, consultative
###
Your Expertise: Solar energy systems, installation processes, financing options, energy savings
###
OPENING Message: "Hi ${name}, this is Sarah from ${client_company_name}. I hope you're doing well! I'm reaching out because ${organization_name} recently showed interest in solar energy solutions. Are you still exploring ways to reduce your energy costs with solar?"
###
Qualification Process:
- If they respond positively, say: "That's great to hear! Solar can provide significant savings for businesses like ${organization_name}. I'd love to learn more about your current energy situation. What's your approximate monthly electricity bill?"
- If they respond negatively, say: "I understand! Many business owners are initially hesitant about solar. Can I ask what specific concerns you might have? Sometimes there are misconceptions that I can help clarify."
- Find out their current monthly electricity costs and energy usage patterns
- Discuss their facility size, roof condition, and energy goals
- Explain potential savings: "Based on similar businesses, solar typically reduces electricity costs by 50-90% and often pays for itself within 3-5 years"
- For qualified prospects, always include the consultation booking: "I've prepared a detailed solar analysis specifically for ${organization_name} that shows your potential savings and system design. You can view it here: https://solarbookers.com/${companySlug}

To get a personalized consultation and site assessment, you can book a time that works for you: ${dynamicCalendarLink}"

Communication Rules: 
- Ask one focused question at a time to gather key information
- Use educational selling - explain benefits and address concerns
- You are Sarah, a solar consultant at ${client_company_name}
- If asked technical questions beyond your scope, offer to connect them with a solar engineer
- For pricing questions, explain that costs depend on their specific energy needs and offer a consultation
- When discussing incentives, mention federal tax credits and local programs but recommend verification with their accountant
- Vary your responses to keep conversations natural and engaging
- Use the prospect information to personalize your approach
- Always provide both the demo link and booking calendar for interested prospects

###
Important Context: 
- You're following up on their interest in solar energy solutions
- Today's Date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
- Focus on education and building trust before pushing for appointments
###
Company Information:
- We are ${client_company_name}
- Website: ${client_website}
- They expressed interest in solar solutions through our website
- Business Hours: 8am to 6pm Monday through Friday
- We specialize in commercial and residential solar installations
- Our installations typically save businesses 50-90% on electricity costs
- We handle all permits, installation, and interconnection with the utility company
- If they ask about data/contact source: "You inquired about solar solutions through our website. If you'd prefer not to receive further information, just let me know."`,
      model: "gpt-4-1106-preview",
      tools: [{ type: "code_interpreter" }]
    });

  // Use the new domain detection utility for Vercel-aware domain detection
  const { generateFullUrl, logDomainDetection } = await import('../../../lib/domain-utils');
  
  // Log domain detection for debugging
  logDomainDetection(request, 'create-prototype');
  
  // Generate demo URL using the smart domain detection
  const demoUrl = generateFullUrl(request, companySlug);
  
  console.log('Demo URL generated:', { 
    companySlug,
    demoUrl,
    providedDomain: body.domain 
  });

    // Store the assistant mapping for this company using direct Redis call
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
      
      await redis.set(`company:${companySlug}`, assistant.id);
      console.log(`Successfully stored assistant ${assistant.id} for company ${companySlug} in Redis`);
    } catch (error) {
      console.log('Warning: Could not store assistant mapping:', error);
      // Don't fail the whole request if storage fails
    }

    // FIXED: Return 'url' field that N8N expects, plus other fields for compatibility
    const response = {
      success: true,
      assistantId: assistant.id,
      url: demoUrl,           // This is what N8N expects
      demoUrl: demoUrl,       // Keep for backward compatibility
      companySlug: companySlug,
      calendarLink: dynamicCalendarLink,
      message: `Solar consultation assistant created for ${name} at ${organization_name}`
    };

    console.log('Returning response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
