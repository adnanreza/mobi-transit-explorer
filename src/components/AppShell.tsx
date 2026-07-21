import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { asOfLabel } from "@/data";
import { setTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

type AppShellProps = {
  children: ReactNode;
  navItems: NavItem[];
  className?: string;
};

export function AppShell({ children, navItems, className }: AppShellProps) {
  const [activeHref, setActiveHref] = useState(navItems[0]?.href ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // After a nav click, smooth scroll sweeps past intermediate sections;
  // hold the clicked state briefly so the active link doesn't flicker.
  const suppressUntil = useRef(0);

  // Close the mobile menu on Escape, outside tap, or growing to desktop width.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onOutside = (e: Event) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        setActiveHref(window.location.hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Scrollspy: the active nav link follows reading position. This is state
  // tracking, not motion, so it is not gated on prefers-reduced-motion.
  useEffect(() => {
    const ids = navItems.map((item) => item.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const inView = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target.id);
          else inView.delete(entry.target.id);
        }
        if (Date.now() < suppressUntil.current) return;
        const currentId = ids.filter((id) => inView.has(id)).pop();
        if (currentId) setActiveHref(`#${currentId}`);
      },
      // collapse the observation zone to a band ~20-30% down the viewport
      { rootMargin: "-20% 0px -70% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navItems]);

  return (
    <main className={cn("min-h-screen bg-background", className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
      >
        Skip to content
      </a>
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="whitespace-nowrap text-[15px] font-medium tracking-[-0.01em] text-foreground">
              Mobi Transit Explorer
            </h1>
            <p className="hidden truncate text-sm text-muted-foreground lg:block">
              How bike share extends transit in Vancouver
            </p>
          </div>

          <div className="flex items-center gap-1 md:gap-4">
            {/* Desktop / tablet: inline nav */}
            <nav
              aria-label="Primary navigation"
              className="hidden items-center gap-5 md:flex"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={() => {
                    suppressUntil.current = Date.now() + 700;
                    setActiveHref(item.href);
                  }}
                  className={cn(
                    "whitespace-nowrap rounded-sm py-1 text-[15px] transition-colors hover:text-foreground",
                    activeHref === item.href
                      ? "text-foreground underline decoration-1 underline-offset-8"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <ThemeToggle />

            {/* Mobile: hamburger button */}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile: dropdown panel */}
        {menuOpen ? (
          <nav
            id="mobile-nav"
            aria-label="Primary navigation"
            className="absolute inset-x-0 top-full border-b border-border bg-background md:hidden"
          >
            <div className="container flex flex-col py-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={() => {
                    suppressUntil.current = Date.now() + 700;
                    setActiveHref(item.href);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-2 py-3 text-base transition-colors hover:bg-muted",
                    activeHref === item.href
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <div id="main-content" className="container pb-24 pt-16 sm:pt-24">
        {children}
      </div>

      <SiteFooter />
    </main>
  );
}

// Matches the portfolio's nav toggle: one icon button at the far right of
// the header. The `dark` class on <html> is the source of truth (set before
// first paint by the inline script in index.html); this just flips it.
function ThemeToggle() {
  const theme = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Dark theme"
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:h-9 md:w-9"
    >
      {dark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

const FOOTER_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Built by",
    links: [
      { label: "adnanreza.com", href: "https://adnanreza.com" },
      { label: "GitHub — source", href: "https://github.com/adnanreza/mobi-transit-explorer" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/adnanreza/" },
    ],
  },
  {
    heading: "Data sources",
    links: [
      { label: "Mobi by Rogers system data", href: "https://www.mobibikes.ca/en/system-data" },
      { label: "Mobi GBFS feed", href: "https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/gbfs.json" },
      { label: "City of Vancouver Open Data", href: "https://opendata.vancouver.ca" },
      { label: "Environment & Climate Change Canada", href: "https://climate.weather.gc.ca" },
    ],
  },
  {
    heading: "Basemap",
    links: [
      { label: "OpenFreeMap", href: "https://openfreemap.org" },
      { label: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-sm font-medium tracking-tight text-foreground">
              Mobi Transit Explorer
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Nine years of Vancouver bike share, cleaned and mapped. A data
              product by Adnan Reza.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="eyebrow">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-foreground underline decoration-muted-2 decoration-1 underline-offset-4 transition-colors hover:decoration-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Data through {asOfLabel} · regenerated with each monthly Mobi release
        </p>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          An independent, non-commercial project — not affiliated with, endorsed by, or
          approved by Mobi by Rogers, Vancouver Bike Share Inc., or the City of Vancouver.
          "Mobi" is a trademark of Vancouver Bike Share Inc., used here descriptively to
          identify the public dataset being analyzed. Trip data is used under the Mobi Data
          License Agreement; weather is based on Environment and Climate Change Canada data.
        </p>
      </div>
    </footer>
  );
}
