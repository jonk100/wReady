import type { APIRoute } from 'astro';
import { ChordService } from '../../../services/chords/ChordService';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('API received body:', JSON.stringify(body, null, 2));
    
    // Pass the parsed JSON directly to the service
    const result = await ChordService.createChord(body);

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      message: 'Chord created successfully'
    }), { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Unknown error occurred',
      details: error.stack
    }), { status: 400 });
  }
};