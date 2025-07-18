import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'assistants.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read assistant mappings from file
function readAssistants(): Record<string, string> {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading assistants file:', error);
    return {};
  }
}

// Write assistant mappings to file
function writeAssistants(assistants: Record<string, string>) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(assistants, null, 2));
  } catch (error) {
    console.error('Error writing assistants file:', error);
  }
}

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

    // Read current data
    const assistants = readAssistants();
    
    // Add new mapping
    assistants[companySlug] = assistantId;
    
    // Write back to file
    writeAssistants(assistants);
    
    console.log(`Stored assistant ${assistantId} for company ${companySlug}`);
    
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

    // Read current data
    const assistants = readAssistants();
    const assistantId = assistants[companySlug];
    
    if (!assistantId) {
      console.log(`No assistant found for company: ${companySlug}`);
      console.log('Available companies:', Object.keys(assistants));
      return NextResponse.json(
        { error: 'No assistant found for this company' },
        { status: 404 }
      );
    }

    console.log(`Found assistant ${assistantId} for company ${companySlug}`);

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