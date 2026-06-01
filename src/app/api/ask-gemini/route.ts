import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { NextResponse } from 'next/server';

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    data: match[2],
    mimeType: match[1],
  };
}

export async function POST(request: Request) {
  try {
    const { apiKey, image, messages, model: requestedModel, prompt, roadmapContext } = (await request.json()) as {
      apiKey?: string;
      image?: string;
      messages?: { role: 'user' | 'assistant' | 'system'; content: string }[];
      model?: string;
      prompt?: string;
      roadmapContext?: string;
    };

    const userPrompt = prompt?.trim() || messages?.at(-1)?.content?.trim();

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'Add your Gemini API key first. This app uses BYOK.' }, { status: 400 });
    }

    const modelName = requestedModel?.trim() || 'gemini-2.5-flash';
    const model = new GoogleGenerativeAI(apiKey.trim()).getGenerativeModel({
      model: modelName,
    });

    const conversationText = (messages || [])
      .filter((message) => message.content?.trim())
      .slice(-16)
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const agenticPrompt = [
      'You are Journey Agent, an agentic personal roadmap coach inside Personamaxing Hub.',
      'Help the user plan, break down goals, reflect on progress, and suggest concrete next actions.',
      'When useful, reference their roadmap context. Be concise, practical, and action-oriented.',
      roadmapContext ? `Current roadmap context:\n${roadmapContext}` : '',
      conversationText ? `Conversation so far:\n${conversationText}` : '',
      `Latest user request:\n${userPrompt}`,
    ].filter(Boolean).join('\n\n---\n\n');

    const parts: Part[] = [{ text: agenticPrompt }];

    if (image) {
      const parsedImage = parseDataUrl(image);
      if (!parsedImage) {
        return NextResponse.json({ error: 'Image must be a base64 data URL' }, { status: 400 });
      }

      parts.push({
        inlineData: {
          data: parsedImage.data,
          mimeType: parsedImage.mimeType,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response.text();

    return NextResponse.json({
      response,
      executed_command: `gemini-sdk-byok:${modelName}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini SDK execution error:', error);
    return NextResponse.json({ error: 'Failed to call Gemini API', details: errorMessage }, { status: 500 });
  }
}
