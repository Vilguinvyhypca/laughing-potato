import { mkdir, rm, writeFile } from "node:fs/promises";
import { createInterface, emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";

const jellyfinUrl = (process.env.JELLYFIN_URL ?? "http://127.0.0.1:8096").replace(/\/$/, "");
const catalogFile = new URL("../data/catalog.json", import.meta.url);
const posterDirectory = new URL("../public/catalog/", import.meta.url);
const authorization = 'MediaBrowser Client="Hymecymeyseh Catalog Sync", Device="Local", DeviceId="hymecymeyseh-catalog-sync", Version="1.0.0"';
const excludedTitlePattern = /bible black|rape|hentai|porn|xxx|only imari/i;

function ask(question) {
  const terminal = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => terminal.question(question, (answer) => {
    terminal.close();
    resolve(answer.trim());
  }));
}

function askHidden(question) {
  if (!stdin.isTTY || !stdin.setRawMode) return ask(question);
  stdout.write(question);
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("keypress", onKeypress);
      stdout.write("\n");
      resolve(value);
    };
    const onKeypress = (sequence, key) => {
      if (key?.ctrl && key.name === "c") {
        stdin.setRawMode(false);
        stdin.off("keypress", onKeypress);
        reject(new Error("Catalog sync cancelled."));
      } else if (key?.name === "return" || key?.name === "enter") {
        finish();
      } else if (key?.name === "backspace") {
        if (value.length) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
      } else if (sequence && !key?.ctrl && !key?.meta) {
        value += sequence;
        stdout.write("•");
      }
    };
    stdin.on("keypress", onKeypress);
  });
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "title";
}

async function jellyfinFetch(path, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("X-Emby-Token", token);
  const response = await fetch(`${jellyfinUrl}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`Jellyfin returned ${response.status} for ${path.split("?")[0]}.`);
  return response;
}

const username = process.env.JELLYFIN_USERNAME ?? await ask("Jellyfin username: ");
const password = process.env.JELLYFIN_PASSWORD ?? await askHidden("Jellyfin password: ");

if (!username) throw new Error("A Jellyfin username is required.");

const authentication = await jellyfinFetch("/Users/AuthenticateByName", null, {
  method: "POST",
  headers: { Authorization: authorization, "Content-Type": "application/json" },
  body: JSON.stringify({ Username: username, Pw: password }),
}).then((response) => response.json());

const query = new URLSearchParams({
  Recursive: "true",
  IncludeItemTypes: "Movie,Series",
  Fields: "Overview,Genres,ProductionYear,CommunityRating,RunTimeTicks,OfficialRating,Taglines,Studios,ImageTags",
  SortBy: "SortName",
  SortOrder: "Ascending",
  ImageTypeLimit: "1",
  EnableImageTypes: "Primary",
});
const library = await jellyfinFetch(`/Users/${authentication.User.Id}/Items?${query}`, authentication.AccessToken)
  .then((response) => response.json());

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await rm(posterDirectory, { recursive: true, force: true });
await mkdir(posterDirectory, { recursive: true });

const usedSlugs = new Set();
const items = [];

for (const item of library.Items ?? []) {
  const genres = item.Genres ?? [];
  if (genres.includes("Adult") || excludedTitlePattern.test(item.Name)) continue;

  const baseSlug = slugify(`${item.Name}-${item.ProductionYear ?? item.Type}`);
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
  usedSlugs.add(slug);

  let poster = null;
  if (item.ImageTags?.Primary) {
    const image = await jellyfinFetch(
      `/Items/${item.Id}/Images/Primary?maxWidth=900&quality=88&tag=${encodeURIComponent(item.ImageTags.Primary)}`,
      authentication.AccessToken,
    );
    const extension = image.headers.get("content-type")?.includes("png") ? "png" : "jpg";
    const filename = `${slug}.${extension}`;
    await writeFile(new URL(filename, posterDirectory), Buffer.from(await image.arrayBuffer()));
    poster = `/catalog/${filename}`;
  }

  items.push({
    slug,
    title: item.Name,
    type: item.Type === "Series" ? "Series" : "Movie",
    year: item.ProductionYear ?? null,
    rating: item.CommunityRating ?? null,
    runtimeMinutes: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 600_000_000) : null,
    contentRating: item.OfficialRating ?? null,
    genres,
    tagline: item.Taglines?.[0] ?? "",
    overview: item.Overview ?? "",
    studio: item.Studios?.[0]?.Name ?? null,
    poster,
  });
}

const catalog = {
  generatedAt: new Date().toISOString(),
  source: "Sanitized Jellyfin catalog snapshot",
  total: items.length,
  items,
};

await writeFile(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
stdout.write(`Catalog sync complete: ${items.length} movies and series exported.\n`);
stdout.write(`No password, access token, user ID, server address, or playback URL was saved.\n`);
