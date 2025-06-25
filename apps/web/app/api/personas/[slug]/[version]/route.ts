import { NextRequest } from 'next/server'; // Keep NextRequest import
import fs from 'fs/promises';
import path from 'path';

export async function PUT(
  request: Request, // Change to generic Request
  { params }: { params: { slug: string; version: string } }
) {
  const { slug, version } = params;
  try {
    const { content } = await request.json();
    const personaDir = path.join(process.cwd(), 'data', 'personas', slug);

    // Ensure persona directory exists
    try {
      await fs.access(personaDir);
    } catch {
      await fs.mkdir(personaDir, { recursive: true }); // Use fs.mkdir
    }

    // Save new version
    const filePath = path.join(personaDir, `${version}.yaml`);
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
