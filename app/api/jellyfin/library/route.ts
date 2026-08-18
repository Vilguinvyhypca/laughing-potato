import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jellyfinJson } from "../../../../lib/jellyfin";

export const dynamic = "force-dynamic";

type JellyfinItem = {
  Id: string;
  Name: string;
  Type: string;
  Overview?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  RunTimeTicks?: number;
  ImageTags?: { Primary?: string };
  SeriesName?: string;
};

type ItemsResult = { Items: JellyfinItem[]; TotalRecordCount: number };

export async function GET() {
  const store = await cookies();
  const token = store.get("jellyfin_token")?.value;
  const userId = store.get("jellyfin_user")?.value;
  const encodedName = store.get("jellyfin_name")?.value;

  if (!token || !userId) {
    return NextResponse.json({ authenticated: false, items: [] }, { status: 401 });
  }

  const query = new URLSearchParams({
    Recursive: "true",
    IncludeItemTypes: "Movie,Series,Episode,Video",
    Fields: "Overview,ProductionYear,CommunityRating,RunTimeTicks,SeriesName",
    SortBy: "DateCreated,SortName",
    SortOrder: "Descending",
    ImageTypeLimit: "1",
    EnableImageTypes: "Primary",
    Limit: "60",
  });

  try {
    const result = await jellyfinJson<ItemsResult>(`/Users/${userId}/Items?${query}`, {
      headers: { "X-Emby-Token": token },
    });
    return NextResponse.json({
      authenticated: true,
      userName: encodedName ? decodeURIComponent(encodedName) : "Jellyfin user",
      total: result.TotalRecordCount,
      items: result.Items.map((item) => ({
        id: item.Id,
        name: item.Name,
        type: item.Type,
        overview: item.Overview ?? "",
        year: item.ProductionYear ?? null,
        rating: item.CommunityRating ?? null,
        runtimeMinutes: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 600_000_000) : null,
        seriesName: item.SeriesName ?? null,
        imageTag: item.ImageTags?.Primary ?? null,
      })),
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, items: [], error: "Your Jellyfin session has expired." },
      { status: 401 },
    );
  }
}
