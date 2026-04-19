import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  let tempImagePath = '';
  try {
    const { prompt, image } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let command = `gemini -p "${prompt.replace(/"/g, '\\"')}"`;

    if (image) {
      // image is expected to be a base64 string (data:image/png;base64,...)
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      tempImagePath = path.join(os.tmpdir(), `journey_upload_${Date.now()}.png`);
      await fs.writeFile(tempImagePath, buffer);
      command += ` @${tempImagePath}`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Gemini CLI stderr:', stderr);
    }

    return NextResponse.json({ response: stdout, executed_command: command });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini CLI execution error:', error);
    return NextResponse.json({ error: 'Failed to execute Gemini CLI', details: errorMessage }, { status: 500 });
  } finally {
    // Clean up temp image if created
    if (tempImagePath) {
      try { await fs.unlink(tempImagePath); } catch {}
    }
  }
}
