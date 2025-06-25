import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; version: string } }
) {
  try {
    const { content } = await request.json();
    const personaDir = path.join(process.cwd(), 'data', 'personas', params.slug);

    // Ensure persona directory exists
    try {
      await fs.access(personaDir);
    } catch {
      await mkdir(personaDir, { recursive: true });
    }

    // Save new version
    const filePath = path.join(personaDir, `${params.version}.yaml`);
    await fs.writeFile(filePath, content, 'utf-8');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error saving persona:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save persona version' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
