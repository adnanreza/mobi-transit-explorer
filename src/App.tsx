import { Bike, Database } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Explorer } from "@/components/Explorer";
import { FlowsSection } from "@/components/flows/FlowsSection";
import { Methodology } from "@/components/Methodology";
import { OpportunityTable } from "@/components/OpportunityTable";
import { OverviewCards } from "@/components/OverviewCards";
import { PageSection } from "@/components/PageSection";
import { RealMobiCharts } from "@/components/RealMobiCharts";
import { Reveal } from "@/components/Reveal";
import { StorySection } from "@/components/story/StorySection";
import { WeatherModelBlock } from "@/components/story/WeatherModelBlock";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { meta } from "@/data";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Nine years", href: "#story" },
  { label: "Forecast", href: "#forecast" },
  { label: "Flows", href: "#flows" },
  { label: "Map", href: "#map" },
  { label: "Signals", href: "#opportunities" },
  { label: "Methodology", href: "#methodology" },
];

const totalTrips = meta.totals.trips.toLocaleString("en-CA");
const millionKm = (meta.totals.distanceKm / 1e6).toFixed(1);

function App() {
  return (
    <AppShell navItems={navItems}>
      <PageSection spacing="hero" className="mx-auto max-w-4xl">
        <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground motion-safe:animate-fade-up sm:text-6xl lg:text-7xl">
          Nine years of Vancouver,
          <br />
          by bike share.
        </h2>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] sm:text-xl sm:leading-9">
          {totalTrips} Mobi trips — {millionKm} million kilometres of riding —
          from every monthly trip file Mobi has published, cleaned and mapped
          against Vancouver's transit network.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:240ms]">
          <Button asChild size="lg" className="group">
            <a href="#map">
              See the map
              <Bike
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg" className="group">
            <a href="#methodology">
              How the data works
              <Database
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </a>
          </Button>
        </div>
      </PageSection>

      <Reveal>
        <PageSection id="overview" className="space-y-10">
          <SectionHeader
            title="Overview"
            description="A fast read on nine and a half years of public Mobi trips (2017–2026, as of May 2026): volume, timing, bike mix, and where the network is busiest."
          />
          <OverviewCards />
          <RealMobiCharts />
        </PageSection>
      </Reveal>

      <Reveal delay={100}>
        <PageSection id="story" className="space-y-14">
          <SectionHeader
            title="Nine years"
            description="What changed between the first full year and today — growth, seasons, a pandemic, and a new kind of bike. Data: 2017–2026, as of May 2026."
          />
          <StorySection />
        </PageSection>
      </Reveal>

      <Reveal delay={100}>
        <PageSection id="forecast" className="space-y-10">
          <SectionHeader
            title="Forecast"
            description="What moves ridership: a model over calendar and Environment Canada weather, trained on 2017–2024 and tested on everything since. Pick a day."
          />
          <WeatherModelBlock />
        </PageSection>
      </Reveal>

      <Reveal delay={100}>
        <PageSection id="flows" className="space-y-10">
          <SectionHeader
            title="Flows"
            description="Bikes don't stay where riders leave them. Where the network fills, where it drains, and the daily work of putting it back."
          />
          <FlowsSection />
        </PageSection>
      </Reveal>

      <Reveal delay={100}>
        <PageSection id="map" className="space-y-10">
          <SectionHeader
            title="Map"
            description="Every active station at its true location. Explore trailing-12-month metrics and each station's transit connector profile."
          />
          <Explorer />
        </PageSection>
      </Reveal>

      <Reveal delay={200}>
        <PageSection id="opportunities" className="space-y-10">
          <SectionHeader
            title="Signals to validate"
            description="Where the data shows pressure or unrealized transit connections — patterns worth investigating, ranked from the trailing twelve months of trips."
          />
          <OpportunityTable />
        </PageSection>
      </Reveal>

      <Reveal delay={300}>
        <PageSection id="methodology" className="space-y-10">
          <SectionHeader
            title="Methodology"
            description="How nine and a half years of messy public files (2017–2026, as of May 2026) become one dataset, what the connector score means, and what the data cannot say."
          />
          <Methodology />
        </PageSection>
      </Reveal>
    </AppShell>
  );
}

export default App;
