import type { APIRoute } from "astro";
import { SongService } from "../../../services/songs/SongService";

export const prerender = false;

type CreateSongPayload = {
  title: string;
  slug: string;
  keyRoot: string;
  keyMode: string;
  tempo?: number;
  timeSignatureTop: number;
  timeSignatureBottom: number;
  chordVoicings: string[];
  structure: string[];
  sections: Array<{
    name: string;
    chords: string[];
    bars: number;
    repeats?: number;
  }>;
  album?: string;
  chordSheetUrl?: string;
  status?: string;
  themes?: string[];
  body?: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateSongPayload;
    console.log("API received body:", JSON.stringify(body, null, 2));

    const allowWrite = (
      (import.meta.env.ALLOW_CONTENT_WRITE ?? process.env.ALLOW_CONTENT_WRITE ?? "")
        .toLowerCase() === "true"
    );
    if (!allowWrite) {
      return new Response(
        JSON.stringify({
          success: true,
          id: body.slug,
          message: "Song created successfully (preview mode)",
        }),
        { status: 201 }
      );
    }

    const result = await SongService.createSong(body);

    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
        message: "Song created successfully",
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("API Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const details = err instanceof Error ? err.stack : undefined;
    return new Response(
      JSON.stringify({
        success: false,
        message: message || "Unknown error occurred",
        details,
      }),
      { status: 400 }
    );
  }
};
