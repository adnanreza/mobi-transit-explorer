import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Explorer } from "@/components/Explorer";
import { FeatureStatusBadge } from "@/components/FeatureStatusBadge";
import { Methodology } from "@/components/Methodology";
import { OverviewCards } from "@/components/OverviewCards";
import { OpportunityTable } from "@/components/OpportunityTable";
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

      <PageSection id="overview" className="space-y-6">
        <SectionHeader
          title="Overview"
          description="A fast read on the sample Mobi network, transit adjacency, and opportunity signals that will guide the explorer."
          className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
        />
        <OverviewCards />
      </PageSection>

      <PageSection id="map" className="space-y-6">
        <SectionHeader
          title="Map"
          description="Filter sample trips, inspect station geography, and select a station to review its transit connector profile."
          className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
        />
        <Explorer />
      </PageSection>

      <PageSection id="opportunities" className="space-y-6">
        <SectionHeader
          title="Opportunities"
          description="A ranked view of where bike share and transit connections can be improved next."
          className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
        />
        <OpportunityTable />
      </PageSection>

      <PageSection id="methodology" className="space-y-6">
        <SectionHeader
          title="Methodology"
          description="How the mock MVP works today, what the connector score represents, and how public Mobi CSVs can replace sample data later."
          className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
        />
        <Methodology />
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
