import { ArrowRight, Bike, MapPinned, Route, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navItems = ["Overview", "Map", "Opportunities", "Methodology"];

const sections = [
  {
    id: "overview",
    title: "Overview",
    description:
      "A concise view of how bike share can support first-mile and last-mile transit trips across Vancouver.",
    icon: Route,
  },
  {
    id: "map",
    title: "Map",
    description:
      "A future interactive layer will place Mobi stations alongside transit context and neighborhood access.",
    icon: MapPinned,
  },
  {
    id: "opportunities",
    title: "Opportunities",
    description:
      "Upcoming scoring will highlight station gaps, multimodal connections, and areas worth a closer look.",
    icon: Sparkles,
  },
  {
    id: "methodology",
    title: "Methodology",
    description:
      "The MVP starts with sample data while the product structure prepares for future Mobi CSV integration.",
    icon: Bike,
  },
];

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,143,211,0.14),transparent_34rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#eef6fb_100%)]">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/82 backdrop-blur-xl">
        <div className="container flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Bike className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                  Mobi Transit Explorer
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  How bike share extends transit in Vancouver
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/70 text-muted-foreground">
              A front-end data product by Adnan Reza
            </Badge>
          </div>

          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button key={item} asChild variant="ghost" size="sm">
                <a href={`#${item.toLowerCase()}`}>{item}</a>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <div className="container py-12 sm:py-16 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary" variant="secondary">
                Vancouver mobility portfolio
              </Badge>
              <h2 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Find where bike share makes transit feel closer.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Mobi Transit Explorer is a focused front-end data product for
                examining how Vancouver's bike share network can strengthen
                transit access, surface station opportunities, and tell a
                clearer mobility story.
              </p>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                This MVP uses sample data first so the product shell,
                methodology, and interaction model can be shaped before future
                Mobi CSV integration brings in real station and trip context.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <a href="#overview">
                  Explore the shell
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#methodology">Review methodology</a>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-white/80 bg-white/86 shadow-soft backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle>Product foundation</CardTitle>
              <CardDescription>
                The first feature establishes the visual system and product
                narrative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Scope" value="MVP shell" />
                <Metric label="Data" value="Sample first" />
                <Metric label="Mode" value="Front-end" />
                <Metric label="Next" value="CSV-ready" />
              </div>
              <Separator />
              <div className="rounded-lg border bg-accent/55 p-4">
                <p className="text-sm font-medium text-accent-foreground">
                  Built to grow from polished placeholder sections into a real
                  browser-based exploration of Mobi and transit connections.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Card
                key={section.id}
                id={section.id}
                className="bg-white/88 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default App;
