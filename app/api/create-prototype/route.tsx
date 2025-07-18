import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced slug generator that handles long company names
function createCompanySlug(companyName: string): string {
  // Remove common business suffixes first
  const businessSuffixes = [
    'LLC', 'Inc', 'Corporation', 'Corp', 'Limited', 'Ltd', 'Company', 'Co',
    'Solutions', 'Services', 'Group', 'Partners', 'Associates', 'Enterprises',
    'Technologies', 'Tech', 'Systems', 'Consulting', 'Holdings'
  ];
  
  let cleanName = companyName;
  
  // Remove business suffixes (case insensitive)
  businessSuffixes.forEach(suffix => {
    const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
    cleanName = cleanName.replace(regex, '');
  });
  
  // Clean and process
  let slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim()                       // Remove leading/trailing spaces
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
  
  // Handle very long names - keep only meaningful words
  const words = slug.split('-').filter(word => word.length > 0);
  
  // If too many words, prioritize important ones
  if (words.length > 3) {
    // Keep words that are likely important (longer than 2 characters)
    const importantWords = words.filter(word => word.length > 2);
    
    if (importantWords.length <= 3) {
      slug = importantWords.join('-');
    } else {
      // Take first 3 important words
      slug = importantWords.slice(0, 3).join('-');
    }
  }
  
  // Ensure final slug isn't too long (max 30 characters for clean URLs)
  if (slug.length > 30) {
    const truncatedWords = [];
    let currentLength = 0;
    
    for (const word of words) {
      if (currentLength + word.length + 1 <= 30) { // +1 for hyphen
        truncatedWords.push(word);
        currentLength += word.length + 1;
      } else {
        break;
      }
    }
    
    slug = truncatedWords.join('-');
  }
  
  // Fallback if slug is empty or too short
  if (slug.length < 3) {
    slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
  }
  
  return slug;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      // Prospect data
      name, 
      email, 
      organization_name, 
      title, 
      city, 
      state, 
      organization_short_description, 
      industry,
      // Client company details (the solar company using this service)
      client_company_name, // REQUIRED - no default
      client_website, // REQUIRED - no default  
      service_type = "Solar services"
      // calendar_link removed - now generated dynamically
    } = await request.json();

    // Validate required fields (removed calendar_link)
    if (!name || !organization_name || !client_company_name || !client_website) {
      return NextResponse.json(
        { error: 'Name, organization_name, client_company_name, and client_website are required' },
        { status: 400 }
      );
    }

    // Generate dynamic calendar link based on client company name
    const companySlug = createCompanySlug(organization_name);
    const dynamicCalendarLink = `https://calendly.com/${companySlug}`;

    // Create the assistant
    const assistant = await openai.beta.assistants.create({
      name: `${organization_name} ${service_type} Demo Assistant`,
      instructions: `Your job is to qualify leads over SMS for ${service_type}. You will complete your job by asking questions related to 'the qualified prospect' section. If a user doesn't follow the conversational direction, default to your SPIN selling training to keep them engaged. Always stay on topic and do not use conciliatory phrases ("Ah, I see", "I hear you", etc.) when the user expresses disinterest.

###
PROSPECT INFORMATION:
- Name: ${name}
- Company: ${organization_name}
- Title: ${title || 'Not specified'}
- Location: ${city ? `${city}, ${state}` : state || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Company Description: ${organization_short_description || 'Not available'}
###

Your Output style: casual message, conversational, UK Idiom, British dialect
###
Your training: The Challenger Sale, Solar Panels
###
FIRST Message: "It's Sarah from ${client_company_name} here. Is this the same ${name} that got a ${service_type} quote from us in the last couple of months?"
###
Qualified prospect section:
- If their response to the FIRST message is positive I want you to say EXACTLY this - "Thank goodness, my calendar just pinged me to call, but I didn't want to disturb you, are you still looking for help?" but if their response to the FIRST message was negative I want you to say EXACTLY this "Sorry about that, just to confirm, are you interested in installing Solar Panels?". If they have already answered the FIRST message, move on to the next part of this section. 
- Get a rough average of their monthly utility bill(s). 
- Tell them we can help them & will beat any market price then ask them if they'd like to schedule a callback.
- If they say yes, send the following message - "Great! Here's my calendar for you to book in a time - ${dynamicCalendarLink}"

Rules: 
- Only ask one question at a time to find out one piece of information. Persistently engage with the user, avoiding any phrases that acknowledge rejection. 
- Utilize The Challenger Sale training to navigate through objections and guide your interactions.
- You are not AI; you are Sarah, working in admin at ${client_company_name}.
- If a user asks you a question we haven't provided you with an answer for, please default to telling them you're in admin and they can schedule a call with an adviser who can better help them. 
- If they ask for pricing, push for them to speak to an advisor.
- If they ask what deals we have, push for them to speak to an advisor
- If they ask similar questions, make sure you add significant variety in your responses. Don't provide responses that are too similar so they have the best experience.
- Use the prospect information above to personalize your responses when relevant.

###
Note: 
- This is the message they're responding to: "It's Sarah from ${client_company_name} here. Is this the same ${name} that got a ${service_type} quote from us in the last couple of months?". Therefore, omit introductions & begin conversation.
- Today's Date is ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
###
FAQ:
- We are ${client_company_name}
- Website: ${client_website}
- They submitted an inquiry into our website a few months ago
- Opening Hours are 9am to 5pm Monday to Friday.
- We can help them get the very best solar panels and will do everything we can to not be beaten on price.
- If they ask where we got their details/data from you MUST tell them "You made an enquiry via our website, if you no longer wish to speak with us, reply with the word 'delete'"`,
      model: "gpt-4-1106-preview",
      tools: [{ type: "code_interpreter" }]
    });

    // Generate clean demo URL and dynamic calendar link based on client company name
    const baseUrl = 'https://solarbookers.com';
    const demoUrl = `${baseUrl}/${companySlug}`;

    // Store the assistant mapping for this company
    try {
      const storeResponse = await fetch(`https://solarbookers.com/api/company-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: companySlug,
          assistantId: assistant.id
        })
      });
      
      if (!storeResponse.ok) {
        console.log('Warning: Storage API returned error:', storeResponse.status);
      }
    } catch (error) {
      console.log('Warning: Could not store assistant mapping:', error);
      // Don't fail the whole request if storage fails
    }

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      demoUrl: demoUrl,
      companySlug: companySlug,
      calendarLink: dynamicCalendarLink,
      message: `Solar demo assistant created for ${name} at ${organization_name}`
    });

  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant' },
      { status: 500 }
    );
  }
}
