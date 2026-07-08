import { ArrowRight, Bike, MapPinned, Route, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeatureStatusBadge } from "@/components/FeatureStatusBadge";
import { PageSection } from "@/components/PageSection";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Map", href: "#map" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Methodology", href: "#methodology" },
];

const sections = [
  {
    id: "overview",
    title: "Overview",
    description:
      "A concise view of how bike share can support first-mile and last-mile transit trips across Vancouver.",
    icon: Route,
    status: "live" as const,
  },
  {
    id: "map",
    title: "Map",
    description:
      "A future interactive layer will place Mobi stations alongside transit context and neighborhood access.",
    icon: MapPinned,
    status: "planned" as const,
  },
  {
    id: "opportunities",
    title: "Opportunities",
    description:
      "Upcoming scoring will highlight station gaps, multimodal connections, and areas worth a closer look.",
    icon: Sparkles,
    status: "planned" as const,
  },
  {
    id: "methodology",
    title: "Methodology",
    description:
      "The MVP starts with sample data while the product structure prepares for future Mobi CSV integration.",
    icon: Bike,
    status: "future" as const,
  },
];

function App() {
  return (
    <AppShell navItems={navItems}>
      <PageSection
        spacing="hero"
        className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
      >
        <div className="space-y-7">
          <SectionHeader
            eyebrow="Vancouver mobility portfolio"
            title="Find where bike share makes transit feel closer."
            description="Mobi Transit Explorer is a focused front-end data product for examining how Vancouver's bike share network can strengthen transit access, surface station opportunities, and tell a clearer mobility story."
            className="[&_h2]:max-w-4xl [&_h2]:text-4xl [&_h2]:sm:text-5xl [&_h2]:lg:text-6xl"
          />
          <div className="space-y-4">
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

        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-soft backdrop-blur">
          <CardHeader className="pb-4">
            <FeatureStatusBadge status="live" />
            <CardTitle>Product foundation</CardTitle>
            <CardDescription>
              The first features establish the visual system and product
              narrative before deeper data interactions are added.
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
      </PageSection>

      <PageSection className="space-y-6">
        <SectionHeader
          title="Explorer foundation"
          description="A consistent layout system gives each future feature a clear place in the product."
          className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Card
                key={section.id}
                id={section.id}
                className="bg-white/90 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <FeatureStatusBadge status={section.status} />
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </PageSection>
    </AppShell>
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
