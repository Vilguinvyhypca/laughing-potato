import { env } from "cloudflare:workers";

type HttpBinding = {
  fetch(request: Request): Promise<Response>;
};

const LOCAL_JELLYFIN_URL = "http://127.0.0.1:8096";

export const jellyfinAuthorization =
  'MediaBrowser Client="Hymecymeyseh", Device="Web", DeviceId="hymecymeyseh-web", Version="1.0.0"';

export async function jellyfinFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const workerEnv = env as unknown as Record<string, unknown>;
  const binding = workerEnv.CUSTOMER_HTTP_JELLYFIN as HttpBinding | undefined;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (binding?.fetch) {
    return binding.fetch(
      new Request(new URL(path, "http://jellyfin.internal"), {
        ...init,
        headers,
      }),
    );
  }

  const baseUrl = process.env.JELLYFIN_URL ?? LOCAL_JELLYFIN_URL;
  return fetch(new URL(path, baseUrl), { ...init, headers });
}

export async function jellyfinJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await jellyfinFetch(path, init);
  if (!response.ok) {
    throw new Error(`Jellyfin request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}
