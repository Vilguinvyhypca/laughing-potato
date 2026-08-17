"use client";

import { useEffect, useRef, useState } from "react";

const archive = [
  { src: "/gallery/icd218.jpg", label: "Archive 218" },
  { src: "/gallery/icd231.jpg", label: "Archive 231" },
  { src: "/gallery/icd258.jpg", label: "Archive 258" },
  { src: "/gallery/icd307.jpg", label: "Archive 307" },
  { src: "/gallery/icd341.jpg", label: "Archive 341" },
  { src: "/gallery/icd393.jpg", label: "Archive 393" },
  { src: "/gallery/icd404.jpg", label: "Archive 404" },
  { src: "/gallery/icd416.jpg", label: "Archive 416" },
];

export default function Home() {
  const [ageState, setAgeState] = useState<"checking" | "gate" | "accepted" | "blocked">("checking");
  const [muted, setMuted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof archive)[number] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAgeState(window.localStorage.getItem("hyme-age-confirmed") === "yes" ? "accepted" : "gate");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  const acceptAge = () => {
    window.localStorage.setItem("hyme-age-confirmed", "yes");
    setAgeState("accepted");
  };

  const toggleSound = async () => {
    const video = [videoRef.current, mobileVideoRef.current].find(
      (item) => item && window.getComputedStyle(item).display !== "none",
    );
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) await video.play().catch(() => undefined);
  };

  if (ageState === "checking") return <main className="gate-shell" aria-label="Loading" />;

  if (ageState !== "accepted") {
    return (
      <main className="gate-shell">
        <div className="gate-card">
          <img className="gate-logo" src="/media/logo.png" alt="Hymecymeyseh" />
          {ageState === "gate" ? (
            <>
              <p className="eyebrow">Private visual lounge</p>
              <h1>Adults only</h1>
              <p className="gate-copy">
                This site contains mature visual material. By entering, you confirm that you are at least 18 years old and that viewing this content is legal where you live.
              </p>
              <div className="gate-actions">
                <button className="button button-primary" onClick={acceptAge}>I am 18 or older</button>
                <button className="button button-quiet" onClick={() => setAgeState("blocked")}>I am under 18</button>
              </div>
              <p className="privacy-note">No tracking or session recording is used on this page.</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Access unavailable</p>
              <h1>Please close this page.</h1>
              <p className="gate-copy">This experience is only available to adults.</p>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Hymecymeyseh home">
          <img src="/media/logo.png" alt="Hymecymeyseh" />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav id="site-navigation" className={menuOpen ? "nav nav-open" : "nav"} aria-label="Main navigation">
          <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#archive" onClick={() => setMenuOpen(false)}>Archive</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <button className="sound-toggle" type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
          <span aria-hidden="true">{muted ? "◖" : "◕"}</span>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <video ref={videoRef} className="hero-video hero-video-desktop" autoPlay muted loop playsInline preload="metadata" poster="/media/poster-desktop.jpg" aria-hidden="true">
          <source src="/media/hero-desktop.mp4" type="video/mp4" />
        </video>
        <video ref={mobileVideoRef} className="hero-video hero-video-mobile" autoPlay muted loop playsInline preload="metadata" poster="/media/poster-mobile.jpg" aria-hidden="true">
          <source src="/media/hero-mobile.mp4" type="video/mp4" />
        </video>
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">Welcome to Hymecymeyseh</p>
          <h1 id="hero-title">We are here to just have <span>fun.</span></h1>
          <p className="hero-copy">A moving archive of vivid images, curious moments, and playful visual experiments.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#archive">Enter the archive</a>
            <a className="text-link" href="#about">Discover the idea <span aria-hidden="true">↘</span></a>
          </div>
        </div>
        <a className="scroll-cue" href="#archive" aria-label="Scroll to archive">Scroll <span aria-hidden="true">↓</span></a>
      </section>

      <section className="archive-section" id="archive" aria-labelledby="archive-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected files</p>
            <h2 id="archive-title">The archive</h2>
          </div>
          <p>Eight pieces from the original Hymecymeyseh collection. Select any image for a closer look.</p>
        </div>
        <div className="archive-grid">
          {archive.map((item, index) => (
            <button className="archive-card" key={item.src} type="button" onClick={() => setSelected(item)} aria-label={`Open ${item.label}`}>
              <img src={item.src} alt="" loading="lazy" />
              <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="card-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <p className="eyebrow">The idea</p>
        <div className="about-grid">
          <h2 id="about-title">Strange, playful, and impossible to scroll past.</h2>
          <div>
            <p>Hymecymeyseh is a visual lounge for moving images and memorable fragments. It keeps the original site&apos;s experimental energy while making the experience easier to explore on every screen.</p>
            <a className="text-link" href="#top">Back to the beginning <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </section>

      <footer>
        <img src="/media/logo.png" alt="Hymecymeyseh" />
        <p>Adults only · Please view responsibly</p>
        <p>© {new Date().getFullYear()} Hymecymeyseh</p>
      </footer>

      {selected && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={selected.label} onClick={() => setSelected(null)}>
          <button className="lightbox-close" type="button" onClick={() => setSelected(null)} aria-label="Close image">Close ×</button>
          <img src={selected.src} alt={selected.label} onClick={(event) => event.stopPropagation()} />
          <p>{selected.label}</p>
        </div>
      )}
    </main>
  );
}
