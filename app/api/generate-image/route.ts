import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const client = new OpenAI({
  baseURL: 'https://api.studio.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEBIUS_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await client.images.generate({
      model: 'black-forest-labs/flux-dev',
      response_format: 'url',
      response_extension: 'png',
      width: 1024,
      height: 1024,
      num_inference_steps: 28,
      negative_prompt: '',
      seed: -1,
      prompt: prompt,
    } as any);

    console.log('Image generated');

    const imageUrl = response.data?.[0]?.url;
    console.log(imageUrl);
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl,
      revisedPrompt,
      originalPrompt: prompt,
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
