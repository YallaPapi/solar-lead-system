import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import OpenAI from 'openai';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const companySlug = request.nextUrl.searchParams.get('company');
    const action = request.nextUrl.searchParams.get('action') || 'all';
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      },
      config: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasRedisUrl: !!process.env.KV_REST_API_URL,
        hasRedisToken: !!process.env.KV_REST_API_TOKEN,
      }
    };

    // Test Redis connection
    if (action === 'all' || action === 'redis') {
      try {
        // Test basic connection with a test key
        const testKey = `debug-test-${Date.now()}`;
        await redis.set(testKey, 'test-value', { ex: 60 }); // 60 second expiry
        const testValue = await redis.get(testKey);
        await redis.del(testKey);
        
        debugInfo.redis = {
          connected: true,
          testResult: testValue === 'test-value' ? 'SUCCESS' : 'FAILED',
        };
        
        if (companySlug) {
          const assistantId = await redis.get(`company:${companySlug}`);
          debugInfo.redis.companyData = {
            slug: companySlug,
            assistantId: assistantId,
            exists: !!assistantId
          };
        }
      } catch (error) {
        debugInfo.redis = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test OpenAI connection
    if (action === 'all' || action === 'openai') {
      try {
        const models = await openai.models.list();
        debugInfo.openai = {
          connected: true,
          modelsCount: models.data.length,
        };
        
        // Test assistant functionality if we have a company slug
        if (companySlug && debugInfo.redis?.companyData?.assistantId) {
          try {
            const assistant = await openai.beta.assistants.retrieve(debugInfo.redis.companyData.assistantId);
            debugInfo.openai.assistant = {
              id: assistant.id,
              name: assistant.name,
              model: assistant.model,
              exists: true
            };
          } catch (error) {
            debugInfo.openai.assistant = {
              exists: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      } catch (error) {
        debugInfo.openai = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Check environment variables
    if (action === 'all' || action === 'environment') {
      const requiredVars = [
        'OPENAI_API_KEY',
        'KV_REST_API_URL', 
        'KV_REST_API_TOKEN'
      ];
      
      const varStatus = requiredVars.map(varName => ({
        name: varName,
        present: !!process.env[varName],
        length: process.env[varName]?.length || 0
      }));
      
      const missingVars = varStatus.filter(v => !v.present);
      
      debugInfo.environment = {
        allPresent: missingVars.length === 0,
        variables: varStatus,
        missing: missingVars.map(v => v.name)
      };
    }

    // Test URL generation algorithm  
    if (action === 'all' || action === 'urlGeneration') {
      try {
        const testCompanies = [
          'Test Company Name',
          'Solar Solutions LLC',
          'Green Energy Inc.',
          'ABC Solar & Wind Co'
        ];
        
        debugInfo.urlGeneration = {
          algorithm: 'n8n-compatible',
          results: testCompanies.map(company => {
            // Use exact same algorithm as n8n workflow
            const slug = (company || 'demo').toLowerCase()
              .replace(/\b(llc|inc|corp|ltd|co)\b/g, '')
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
              
            return {
              company,
              slug,
              url: `https://solarbookers.com/${slug}`
            };
          })
        };
      } catch (error) {
        debugInfo.urlGeneration = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // List all company mappings if requested
    if (action === 'all' || action === 'companies') {
      try {
        const keys = await redis.keys('company:*');
        debugInfo.companies = {
          count: keys.length,
          slugs: keys.map(key => key.replace('company:', '')),
        };
      } catch (error) {
        debugInfo.companies = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'test-chat':
        if (!data.assistantId || !data.message) {
          return NextResponse.json({ error: 'Missing assistantId or message' }, { status: 400 });
        }
        
        try {
          // Create a test thread
          const thread = await openai.beta.threads.create();
          
          // Add message
          await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: data.message
          });
          
          // Create run
          const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: data.assistantId
          });
          
          return NextResponse.json({
            success: true,
            threadId: thread.id,
            runId: run.id,
            status: run.status
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
      case 'clear-company':
        if (!data.companySlug) {
          return NextResponse.json({ error: 'Missing companySlug' }, { status: 400 });
        }
        
        try {
          await redis.del(`company:${data.companySlug}`);
          return NextResponse.json({ success: true, message: `Cleared ${data.companySlug}` });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug POST failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 