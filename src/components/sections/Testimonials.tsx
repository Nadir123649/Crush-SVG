"use client";

import React, { useRef, useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: "alex",
    name: "Alex R.",
    role: "Lead Frontend Engineer",
    avatar: "/testimonials/alex.png",
    content:
      "CrushSVG transformed how our team handles vector exports. Complex SVGs become pixel-perfect PNGs in seconds — rendering headaches are completely gone.",
    rating: 5,
  },
  {
    id: "sarah",
    name: "Sarah K.",
    role: "Senior Product Designer",
    avatar: "/testimonials/sarah.png",
    content:
      "I no longer open heavy design software just to export a quick graphic. CrushSVG respects the original vector layout every single time. It's become essential.",
    rating: 5,
  },
  {
    id: "marcus",
    name: "Marcus T.",
    role: "Creative Agency Director",
    avatar: "/testimonials/marcus.png",
    content:
      "In our fast-paced agency, precision matters. What you preview on CrushSVG is exactly what you download — sharp, clean PNGs with zero surprises.",
    rating: 4.5,
  },
  {
    id: "elena",
    name: "Elena M.",
    role: "Design Systems Architect",
    avatar: "/testimonials/elena.png",
    content:
      "Retina-sharp icons across every component. CrushSVG handles our entire icon library without a single gradient banding issue or clipped bounding box.",
    rating: 5,
  },
  {
    id: "david",
    name: "David L.",
    role: "Full-Stack Tech Lead",
    avatar: "/testimonials/david.png",
    content:
      "Batch conversion with custom resolution multipliers is a genuine game-changer. An hour of Illustrator exports now takes under two minutes flat.",
    rating: 5,
  },
  {
    id: "chloe",
    name: "Chloe W.",
    role: "Head of Brand Design",
    avatar: "/testimonials/chloe.png",
    content:
      "Paste raw SVG code, get a transparent PNG — it's that simple. Our marketing turnaround for social banners and ads has never been faster.",
    rating: 5,
  },
];

// ─── Star Icons ───────────────────────────────────────────────────────────────

const StarFull = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="#D94A1E"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const StarHalf = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <defs>
      <linearGradient id="hsg" x1="0" x2="100%" y1="0" y2="0">
        <stop offset="50%" stopColor="#D94A1E" />
        <stop offset="50%" stopColor="#DDD5D0" />
      </linearGradient>
    </defs>
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="url(#hsg)"
    />
  </svg>
);

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-[2px]"
      aria-label={`${rating} out of 5 stars`}
    >
      <StarFull /><StarFull /><StarFull /><StarFull />
      {rating >= 5 ? <StarFull /> : <StarHalf />}
    </span>
  );
}

// ─── Quote mark icon ──────────────────────────────────────────────────────────

const QuoteIcon = () => (
  <svg
    width="28"
    height="22"
    viewBox="0 0 28 22"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M0 22V13.467C0 9.689 1.022 6.8 3.067 4.8 5.111 2.8 8.133 1.378 12.133 0.533L13.2 2.8C11.022 3.467 9.311 4.489 8.067 5.867 6.822 7.2 6.2 8.933 6.2 11.067H12.133V22H0ZM15.867 22V13.467C15.867 9.689 16.889 6.8 18.933 4.8 20.978 2.8 24 1.378 28 0.533L29.067 2.8C26.889 3.467 25.178 4.489 23.933 5.867 22.689 7.2 22.067 8.933 22.067 11.067H28V22H15.867Z"
      fill="#F0C9B9"
    />
  </svg>
);

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article
      className="
        w-full sm:w-full
        md:w-[calc((100%-24px)/2)]
        lg:w-[calc((100%-48px)/3)]
        shrink-0 snap-start
        bg-white rounded-[20px]
        border border-[#F0EAE4]
        shadow-[0px_2px_16px_rgba(0,0,0,0.05)]
        hover:shadow-[0_12px_40px_-8px_rgba(217,74,30,0.15)]
        hover:-translate-y-1.5
        transition-all duration-300
        flex flex-col
        overflow-hidden
        group
      "
    >
      {/* Brand accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col flex-1 p-6 md:p-7 gap-4">
        {/* Top row: quote icon left, stars right */}
        <div className="flex items-start justify-between">
          <QuoteIcon />
          <Stars rating={item.rating} />
        </div>

        {/* Review body */}
        <p className="font-body text-[13.5px] leading-[24px] text-[#57534E] flex-1">
          {item.content}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-[#F0EAE4]" />

        {/* Avatar + name + role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-[#F0C9B9] bg-[#FCF1ED]">
            <img
              src={item.avatar}
              alt={item.name}
              className="w-full h-full object-cover select-none"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-heading font-semibold text-[14px] leading-tight text-[#202427] group-hover:text-brand-primary transition-colors duration-200 truncate">
              {item.name}
            </span>
            <span className="font-body text-[12px] text-[#8A827C] truncate">
              {item.role}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const sync = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(max > 0 && el.scrollLeft < max - 6);
    if (max > 0) {
      setActiveDot(Math.min(2, Math.max(0, Math.round((el.scrollLeft / max) * 2))));
    }
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : el.clientWidth;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max * i) / 2, behavior: "smooth" });
    setActiveDot(i);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      sync();
      el.addEventListener("scroll", sync, { passive: true });
    }
    window.addEventListener("resize", sync);
    return () => {
      el?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section
      id="testimonials"
      className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] mt-[20px] md:mt-[30px] scroll-mt-[100px] md:scroll-mt-[140px] overflow-hidden"
    >
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[30px] md:mb-[60px] px-4">
        Trusted by{" "}
        <span className="text-brand-primary">Designers & Developers</span>
      </h2>

      {/* Carousel wrapper */}
      <div className="w-full max-w-[1280px] px-4 sm:px-6">
        {/* Track */}
        <div
          ref={scrollRef}
          className="w-full flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((item) => (
            <TestimonialCard key={item.id} item={item} />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8 md:mt-10">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canLeft}
            aria-label="Previous testimonials"
            className="w-9 h-9 rounded-full border border-[#EAEAEA] bg-white flex items-center justify-center text-[#57534E] hover:border-brand-primary hover:text-brand-primary hover:bg-[#FFF9F7] active:scale-95 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed shadow-[0px_2px_8px_rgba(0,0,0,0.06)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Dots */}
          <div role="tablist" aria-label="Testimonial slides" className="flex items-center gap-[7px]">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                role="tab"
                type="button"
                aria-selected={activeDot === i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  activeDot === i
                    ? "w-5 h-[7px] bg-brand-primary"
                    : "w-[7px] h-[7px] bg-[#DDD0CA] hover:bg-[#FFBFA8]"
                }`}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canRight}
            aria-label="Next testimonials"
            className="w-9 h-9 rounded-full border border-[#EAEAEA] bg-white flex items-center justify-center text-[#57534E] hover:border-brand-primary hover:text-brand-primary hover:bg-[#FFF9F7] active:scale-95 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed shadow-[0px_2px_8px_rgba(0,0,0,0.06)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
