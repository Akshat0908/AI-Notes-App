import { NextRequest, NextResponse } from 'next/server';

// Read Groq API key from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Groq API endpoint

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) { // Check for Groq key
    console.error('Groq API key is not configured.');
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid note content provided.' }, { status: 400 });
    }

    // Simple prompt for summarization
    const prompt = `Summarize the following text concisely:

${content}`;

    const response = await fetch(GROQ_API_URL, { // Use Groq URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`, // Use Groq key
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Use a Groq model (e.g., Llama 3 8B)
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes text concisely.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100, 
        temperature: 0.5, 
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Groq API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}. ${errorBody}`);
    }

    const data = await response.json();

    // Assuming Groq response structure is OpenAI compatible
    const summary = data?.choices?.[0]?.message?.content?.trim();

    if (!summary) {
        console.error('Could not extract summary from Groq response:', data);
        throw new Error('Failed to extract summary from API response.');
    }

    return NextResponse.json({ summary });

  } catch (error: unknown) {
    console.error('Error in /api/summarize:', error);
    let errorMessage = 'Failed to get summary.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 