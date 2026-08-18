"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MediaItem = { id: string; name: string; type: string; overview: string; year: number | null; rating: number | null; runtimeMinutes: number | null; seriesName: string | null; imageTag: string | null };
type LibraryResponse = { authenticated: boolean; userName?: string; total?: number; items: MediaItem[] };
type ServerStatus = { connected: boolean; serverName: string | null; version: string | null };

const filters = ["All", "Movie", "Series", "Episode", "Video"];

export default function Home() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [statusResponse, libraryResponse] = await Promise.all([
      fetch("/api/jellyfin/status", { cache: "no-store" }),
      fetch("/api/jellyfin/library", { cache: "no-store" }),
    ]);
    setStatus(await statusResponse.json());
    setLibrary(libraryResponse.ok ? await libraryResponse.json() : { authenticated: false, items: [] });
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (library?.items ?? []).filter((item) => {
      const matchesFilter = filter === "All" || item.type === filter;
      const matchesQuery = !normalized || `${item.name} ${item.seriesName ?? ""}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, library, query]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigningIn(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/jellyfin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to sign in.");
      setSigningIn(false);
      return;
    }
    await refresh();
    setSigningIn(false);
  };

  const signOut = async () => {
    await fetch("/api/jellyfin/login", { method: "DELETE" });
    setLibrary({ authenticated: false, items: [] });
    setSelected(null);
  };

  if (loading) return <main className="loading-shell"><div className="loading-mark">H</div><p>Connecting to your cinema…</p></main>;

  if (!status?.connected || !library?.authenticated) {
    return (
      <main className="connect-shell">
        <section className="connect-art" aria-hidden="true">
          <div className="film-strip film-strip-one" /><div className="film-strip film-strip-two" />
          <div className="connect-wordmark">HYME</div><p>Your private cinema,<br />curated at home.</p>
        </section>
        <section className="connect-panel">
          <a className="mini-brand" href="/">HYMECYMEYSEH <span>MEDIA</span></a>
          <div className="connect-copy">
            <div className={status?.connected ? "status-chip online" : "status-chip offline"}><span /> {status?.connected ? `${status.serverName} online` : "Server link unavailable"}</div>
            <p className="kicker">Jellyfin collection</p>
            <h1>Everything you love,<br /><em>beautifully arranged.</em></h1>
            <p className="lede">Sign in with your Jellyfin account. Your password travels only to your private server and is never stored by this app.</p>
          </div>
          {status?.connected ? (
            <form className="login-form" onSubmit={signIn}>
              <label>Username<input name="username" autoComplete="username" required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" disabled={signingIn}>{signingIn ? "Opening library…" : "Enter your library"}<span>→</span></button>
            </form>
          ) : (
            <div className="connection-help"><strong>Your web app is ready for Jellyfin.</strong><p>Keep Jellyfin running on this computer, then connect the private server link in Sites to make it available here.</p></div>
          )}
          <footer className="connect-footer">Private by design · Powered by Jellyfin</footer>
        </section>
      </main>
    );
  }

  const featured = visibleItems.find((item) => item.imageTag) ?? visibleItems[0];

  return (
    <main className="library-shell" id="top">
      <header className="library-header">
        <a className="mini-brand" href="#top">HYMECYMEYSEH <span>MEDIA</span></a>
        <nav aria-label="Library navigation"><a href="#featured">Featured</a><a href="#library">Library</a></nav>
        <div className="account"><span>{library.userName}</span><button onClick={signOut}>Sign out</button></div>
      </header>
      {featured && (
        <section className="featured" id="featured">
          {featured.imageTag && <img src={`/api/jellyfin/image?itemId=${featured.id}&tag=${featured.imageTag}`} alt="" />}
          <div className="featured-shade" />
          <div className="featured-copy">
            <p className="kicker">Recently added · {featured.type}</p><h1>{featured.name}</h1>
            <div className="meta-row"><span>{featured.year ?? "New"}</span>{featured.rating && <span>★ {featured.rating.toFixed(1)}</span>}{featured.runtimeMinutes && <span>{featured.runtimeMinutes} min</span>}</div>
            <p>{featured.overview || "A new addition to your private collection."}</p>
            <button onClick={() => setSelected(featured)}>View details <span>↗</span></button>
          </div><a className="down-cue" href="#library">Browse library ↓</a>
        </section>
      )}
      <section className="media-library" id="library">
        <div className="library-title"><div><p className="kicker">Personal collection</p><h2>Your library</h2></div><p>{library.total ?? visibleItems.length} titles available from {status.serverName}</p></div>
        <div className="library-controls">
          <div className="filter-row" role="group" aria-label="Filter media">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
          <label className="search-label">Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or series" /></label>
        </div>
        {visibleItems.length ? <div className="media-grid">{visibleItems.map((item) => (
          <button className="media-card" key={item.id} onClick={() => setSelected(item)}>
            <div className="poster">{item.imageTag ? <img src={`/api/jellyfin/image?itemId=${item.id}&tag=${item.imageTag}`} alt="" loading="lazy" /> : <div className="poster-fallback">{item.name.slice(0, 1)}</div>}<span className="media-type">{item.type}</span></div>
            <span className="media-name">{item.name}</span><span className="media-subtitle">{item.seriesName ?? item.year ?? "In your collection"}</span>
          </button>
        ))}</div> : <div className="empty-state"><strong>No titles found.</strong><p>Try another filter or search.</p></div>}
      </section>
      {selected && <div className="detail-modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={() => setSelected(null)}><article onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button>{selected.imageTag && <img src={`/api/jellyfin/image?itemId=${selected.id}&tag=${selected.imageTag}`} alt="" />}<div><p className="kicker">{selected.type}</p><h2>{selected.name}</h2><div className="meta-row"><span>{selected.year ?? "New"}</span>{selected.rating && <span>★ {selected.rating.toFixed(1)}</span>}{selected.runtimeMinutes && <span>{selected.runtimeMinutes} min</span>}</div><p>{selected.overview || "No description is available for this title."}</p></div></article></div>}
    </main>
  );
}
