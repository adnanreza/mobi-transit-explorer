import { useEffect, useState, type ReactNode } from "react";
import { Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <main
      className={cn(
        "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,143,211,0.12),transparent_34rem),linear-gradient(180deg,#ffffff_0%,#fafcff_54%,#f0f8fd_100%)]",
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-sm"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-white/75 bg-white/86 backdrop-blur-xl">
        <div className="container flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Bike className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                  Mobi Transit Explorer
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  How bike share extends transit in Vancouver
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/75 text-muted-foreground">
              A front-end data product by Adnan Reza
            </Badge>
          </div>

          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={activeHref === item.href ? "outline" : "ghost"}
                size="sm"
              >
                <a
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={() => setActiveHref(item.href)}
                >
                  {item.label}
                </a>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <div id="main-content" className="container py-12 sm:py-16 lg:py-20">
        {children}
      </div>
    </main>
  );
}
