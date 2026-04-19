import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const command = `gemini -p "${prompt.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Gemini CLI stderr:', stderr);
    }

    return NextResponse.json({ response: stdout });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini CLI execution error:', error);
    return NextResponse.json({ error: 'Failed to execute Gemini CLI', details: errorMessage }, { status: 500 });
  }
}
