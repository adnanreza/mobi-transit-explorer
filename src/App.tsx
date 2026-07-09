import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Explorer } from "@/components/Explorer";
import { FeatureStatusBadge } from "@/components/FeatureStatusBadge";
import { Methodology } from "@/components/Methodology";
import { OpportunityTable } from "@/components/OpportunityTable";
import { OverviewCards } from "@/components/OverviewCards";
import { PageSection } from "@/components/PageSection";
import { RealMobiCharts } from "@/components/RealMobiCharts";
import { Reveal } from "@/components/Reveal";
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
            description="Mobi Transit Explorer is a focused front-end data product using public Mobi system CSVs to examine how Vancouver's bike share network can strengthen transit access, surface station opportunities, and tell a clearer mobility story."
            className="[&_h2]:max-w-4xl [&_h2]:text-4xl [&_h2]:sm:text-5xl [&_h2]:lg:text-6xl"
          />
          <div className="space-y-4">
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              This version processes April and May 2026 public Mobi trip files
              into static front-end datasets. Raw CSVs stay outside the app;
              the browser receives generated station metrics, opportunity
              rankings, and canvas-backed charts.
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

        <Card className="overflow-hidden border border-primary/15 bg-gradient-to-br from-white via-white/95 to-primary/[0.03] shadow-soft backdrop-blur">
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
              <Metric label="Data" value="Real CSV" />
              <Metric label="Mode" value="Front-end" />
              <Metric label="Next" value="Geo upgrade" />
            </div>
            <Separator />
            <div className="rounded-lg border bg-gradient-to-br from-accent/60 to-accent/40 p-4">
              <p className="text-sm font-medium text-accent-foreground">
                Built as a browser-only portfolio product: real source data is
                processed at build time, with no backend required.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <Reveal>
        <PageSection id="overview" className="space-y-6">
          <SectionHeader
            title="Overview"
            description="A fast read on public Mobi trips, e-bike usage, departure timing, and station-level opportunity signals."
            className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
          />
          <OverviewCards />
          <RealMobiCharts />
        </PageSection>
      </Reveal>

      <Reveal delay={100}>
        <PageSection id="map" className="space-y-6">
          <SectionHeader
            title="Map"
            description="Filter generated April/May station metrics, inspect station geography, and select a station to review its transit connector profile."
            className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
          />
          <Explorer />
        </PageSection>
      </Reveal>

      <Reveal delay={200}>
        <PageSection id="opportunities" className="space-y-6">
          <SectionHeader
            title="Opportunities"
            description="A ranked view of where bike share and transit connections can be improved next."
            className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
          />
          <OpportunityTable />
        </PageSection>
      </Reveal>

      <Reveal delay={300}>
        <PageSection id="methodology" className="space-y-6">
          <SectionHeader
            title="Methodology"
            description="How public Mobi CSVs are processed, what the connector score represents, and where source-data limitations remain."
            className="[&_h2]:text-2xl [&_h2]:sm:text-3xl"
          />
          <Methodology />
        </PageSection>
      </Reveal>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950 tabular-nums">{value}</p>
    </div>
  );
}

export default App;
