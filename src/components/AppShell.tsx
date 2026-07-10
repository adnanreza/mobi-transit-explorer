import { useEffect, useState, type ReactNode } from "react";
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
            className="-mx-1.5 flex gap-1 overflow-x-auto sm:mx-0 sm:gap-5"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={activeHref === item.href ? "page" : undefined}
                onClick={() => setActiveHref(item.href)}
                className={cn(
                  "rounded-sm px-1.5 py-1 text-sm transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
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

      <footer className="border-t border-border">
        <div className="container flex flex-col gap-2 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            A data product by Adnan Reza. ·{" "}
            <a
              href="https://adnanreza.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              adnanreza.com
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/adnanreza/mobi-transit-explorer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              GitHub
            </a>{" "}
            ·{" "}
            <a
              href="https://www.linkedin.com/in/adnanreza/"
              className="text-foreground underline-offset-2 hover:underline"
            >
              LinkedIn
            </a>
          </p>
          <p>
            Data: Mobi by Rogers system data · Mobi GBFS · City of Vancouver
            Open Data · Basemap © OpenFreeMap, OpenStreetMap contributors.
            Not affiliated with Mobi or the City of Vancouver.
          </p>
        </div>
      </footer>
    </main>
  );
}
