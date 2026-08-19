import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const catalogUrl = new URL("../data/catalog.json", import.meta.url);
const catalogText = await readFile(catalogUrl, "utf8");
const catalog = JSON.parse(catalogText);

test("catalog snapshot is internally consistent", () => {
  assert.ok(catalog.items.length > 0, "catalog must contain at least one title");
  assert.equal(catalog.total, catalog.items.length);
  assert.equal(new Set(catalog.items.map((item) => item.slug)).size, catalog.items.length);
});

test("catalog snapshot contains no private Jellyfin connection data", () => {
  assert.doesNotMatch(catalogText, /AccessToken|JELLYFIN_PASSWORD|X-Emby-Token/i);
  assert.doesNotMatch(catalogText, /(?:localhost|127\.0\.0\.1):8096/i);
});

test("public catalog excludes adult records", () => {
  const excluded = catalog.items.filter((item) => item.genres.includes("Adult"));
  assert.deepEqual(excluded, []);
  assert.doesNotMatch(
    catalog.items.map((item) => item.title).join("\n"),
    /bible black|rape|hentai|porn|xxx|only imari/i,
  );
});

test("poster references resolve to public files", async () => {
  const posters = catalog.items.filter((item) => item.poster);
  await Promise.all(
    posters.map((item) => {
      assert.match(item.poster, /^\/catalog\/[a-z0-9-]+\.(?:jpg|png)$/);
      return access(new URL(`../public${item.poster}`, import.meta.url));
    }),
  );
});
