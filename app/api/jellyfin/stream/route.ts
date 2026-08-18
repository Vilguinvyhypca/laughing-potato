import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { jellyfinFetch } from "../../../../lib/jellyfin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("jellyfin_token")?.value;
  const itemId = request.nextUrl.searchParams.get("itemId");

  if (!token || !itemId || !/^[a-f0-9-]+$/i.test(itemId)) {
    return NextResponse.json({ error: "A valid Jellyfin session and item are required." }, { status: 401 });
  }

  const query = new URLSearchParams({
    static: "false",
    Container: "mp4",
    VideoCodec: "h264",
    AudioCodec: "aac",
    TranscodingProtocol: "http",
    EnableAutoStreamCopy: "true",
    EnableVideoStreamCopy: "true",
    EnableAudioStreamCopy: "true",
  });
  const headers = new Headers({ "X-Emby-Token": token });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);

  const upstream = await jellyfinFetch(`/Videos/${itemId}/stream.mp4?${query}`, {
    headers,
    signal: request.signal,
  });
  const responseHeaders = new Headers();
  for (const name of ["accept-ranges", "content-length", "content-range", "content-type"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("Cache-Control", "private, no-store");

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

