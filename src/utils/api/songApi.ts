/**
 * songApi.ts
 * 
 * Handles song generation API calls
 * 
 */

export async function createSong(data: FormData) {
  const res = await fetch("/api/songs/create", {
    method: "POST",
    body: data,
  });

  const json = await res.json();

  return {
    ok: res.ok && json.ok,
    message: json.error
      ? json.error
      : json.wroteFile
        ? `Wrote ${json.slug}.mdx`
        : "Generated MDX",
    output: json.mdx,
  };
}