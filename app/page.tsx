"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import catalog from "../data/catalog.json";

type CatalogItem = {
  slug: string;
  title: string;
  type: "Movie" | "Series";
  year: number | null;
  rating: number | null;
  runtimeMinutes: number | null;
  contentRating: string | null;
  genres: string[];
  tagline: string | null;
  overview: string | null;
  studio: string | null;
  poster: string | null;
};

const visibleCatalog = (catalog.items as CatalogItem[]).filter(
  (item) => item.poster && !item.genres.includes("Adult"),
);

function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function metadata(item: CatalogItem) {
  return [item.year, item.contentRating, formatRuntime(item.runtimeMinutes)]
    .filter(Boolean)
    .join(" · ");
}

export default function Home() {
  const featured = useMemo(
    () =>
      visibleCatalog.find((item) => item.title === "Deadpool & Wolverine") ??
      visibleCatalog.find((item) => item.overview) ??
      visibleCatalog[0],
    [],
  );
  const genres = useMemo(
    () =>
      Array.from(new Set(visibleCatalog.flatMap((item) => item.genres))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("title");
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matches = visibleCatalog.filter((item) => {
      const searchable = [
        item.title,
        item.overview,
        item.studio,
        item.year,
        ...item.genres,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (typeFilter === "All" || item.type === typeFilter) &&
        (genreFilter === "All" || item.genres.includes(genreFilter))
      );
    });

    return matches.sort((a, b) => {
      if (sortOrder === "newest") return (b.year ?? 0) - (a.year ?? 0);
      if (sortOrder === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });
  }, [genreFilter, query, sortOrder, typeFilter]);

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("All");
    setGenreFilter("All");
    setSortOrder("title");
  };

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.body.classList.add("dialog-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("dialog-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Reelhouse home">
          REEL<span>HOUSE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#catalog">Catalog</a>
          <a href="#membership">Membership</a>
        </nav>
        <a className="button button-small" href="#membership">
          View plans
        </a>
      </header>

      <section
        className="hero"
        id="top"
        style={{ "--hero-image": `url(${featured.poster})` } as React.CSSProperties}
      >
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">Now in the showcase</p>
          <h1>{featured.title}</h1>
          <p className="hero-meta">{metadata(featured)}</p>
          <p className="hero-copy">
            {featured.overview ??
              "Explore the movies currently available in this private media collection."}
          </p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={() => setSelected(featured)}>
              View title
            </button>
            <a className="text-link" href="#catalog">
              Browse catalog <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <p className="catalog-count">
          <strong>{visibleCatalog.length}</strong> titles on display
        </p>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From the library</p>
            <h2>Find your next watch.</h2>
          </div>
          <p>
            Search the collection by title, year, genre, or description. Refine the
            results to find exactly what you want to watch next.
          </p>
        </div>

        <div className="catalog-tools">
          <label className="search-field">
            <span>Search the catalog</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, genres, or keywords"
            />
          </label>
          <label className="select-field">
            <span>Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="All">All types</option>
              <option value="Movie">Movies</option>
              <option value="Series">Series</option>
            </select>
          </label>
          <label className="select-field">
            <span>Genre</span>
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="All">All genres</option>
              {genres.map((genre) => (
                <option value={genre} key={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span>Sort by</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="title">Title A–Z</option>
              <option value="newest">Newest first</option>
              <option value="rating">Highest rated</option>
            </select>
          </label>
        </div>

        <div className="results-summary" aria-live="polite">
          <p>
            <strong>{filteredItems.length}</strong>{" "}
            {filteredItems.length === 1 ? "title" : "titles"}
          </p>
          {(query || typeFilter !== "All" || genreFilter !== "All" || sortOrder !== "title") && (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {filteredItems.length > 0 ? (
          <div className="catalog-grid">
          {filteredItems.map((item, index) => (
            <button
              className="title-card"
              type="button"
              key={item.slug}
              onClick={() => setSelected(item)}
              aria-label={`View details for ${item.title}`}
            >
              <span className="poster-wrap">
                <Image
                  src={item.poster ?? ""}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 50vw, (max-width: 980px) 33vw, 25vw"
                  priority={index < 4}
                />
                <span className="card-arrow" aria-hidden="true">
                  ↗
                </span>
              </span>
              <span className="card-copy">
                <strong>{item.title}</strong>
                <span>{metadata(item) || item.type}</span>
              </span>
            </button>
          ))}
          </div>
        ) : (
          <div className="empty-results">
            <p className="eyebrow">No matches</p>
            <h3>Try a wider search.</h3>
            <p>No titles match the filters you selected.</p>
            <button className="button" type="button" onClick={clearFilters}>
              Reset catalog
            </button>
          </div>
        )}
      </section>

      <section className="membership-section" id="membership">
        <p className="eyebrow">Keep watching</p>
        <h2>The catalog is only the beginning.</h2>
        <p>
          Membership details and availability are coming next. For now, explore what is
          in the collection and make a list of what you want to watch.
        </p>
        <button className="button button-muted" type="button" disabled>
          Plans coming soon
        </button>
      </section>

      <footer>
        <a className="wordmark" href="#top">
          REEL<span>HOUSE</span>
        </a>
        <p>{catalog.total} catalog records · Updated from the media library</p>
      </footer>

      {selected && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section
            className="title-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close title details"
            >
              ×
            </button>
            <Image
              src={selected.poster ?? ""}
              alt={`${selected.title} poster`}
              width={900}
              height={1350}
            />
            <div className="dialog-copy">
              <p className="eyebrow">{selected.type}</p>
              <h2 id="dialog-title">{selected.title}</h2>
              <p className="hero-meta">{metadata(selected)}</p>
              {selected.tagline && <p className="tagline">“{selected.tagline}”</p>}
              <p>{selected.overview ?? "More information about this title is coming soon."}</p>
              {selected.genres.length > 0 && (
                <ul className="genre-list" aria-label="Genres">
                  {selected.genres.slice(0, 4).map((genre) => (
                    <li key={genre}>{genre}</li>
                  ))}
                </ul>
              )}
              <a className="button" href="#membership" onClick={() => setSelected(null)}>
                View membership
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
