import { cookies } from "next/headers";
import { jellyfinFetch } from "../../../../lib/jellyfin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const store = await cookies();
  const token = store.get("jellyfin_token")?.value;
  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");
  const tag = url.searchParams.get("tag");

  if (!token || !itemId || !/^[a-zA-Z0-9-]+$/.test(itemId)) {
    return new Response(null, { status: 404 });
  }

  const query = new URLSearchParams({ maxWidth: "640", quality: "88" });
  if (tag) query.set("tag", tag);
  const upstream = await jellyfinFetch(`/Items/${itemId}/Images/Primary?${query}`, {
    headers: { "X-Emby-Token": token },
  });
  if (!upstream.ok || !upstream.body) return new Response(null, { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
