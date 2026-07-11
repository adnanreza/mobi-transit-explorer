import { useEffect, useRef, useState, type ReactNode } from "react";
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
  // After a nav click, smooth scroll sweeps past intermediate sections;
  // hold the clicked state briefly so the active link doesn't flicker.
  const suppressUntil = useRef(0);

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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex flex-col gap-1.5 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-baseline gap-3">
            <h1 className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
              Mobi Transit Explorer
            </h1>
            <p className="hidden text-sm text-muted-foreground lg:block">
              How bike share extends transit in Vancouver
            </p>
          </div>

          <nav
            aria-label="Primary navigation"
            className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:gap-5 sm:px-0"
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
                  "shrink-0 whitespace-nowrap rounded-sm py-1 text-sm transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                  activeHref === item.href
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="main-content" className="container pb-24 pt-16 sm:pt-24">
        {children}
      </div>

      <SiteFooter />
    </main>
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
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Mobi Transit Explorer
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Nine years of Vancouver bike share, cleaned and mapped. A data
              product by Adnan Reza.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {col.heading}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
          An independent project — not affiliated with, endorsed, or sponsored by
          Mobi by Rogers, Vancouver Bike Share Inc., or the City of Vancouver.
          Mobi trip data is used under the Mobi Data License Agreement for
          non-commercial analysis; weather is based on Environment and Climate
          Change Canada data.
        </p>
      </div>
    </footer>
  );
}
