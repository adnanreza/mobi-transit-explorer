import { MiniTrendChart } from "@/components/charts/MiniTrendChart";
import { stationsArtifact } from "@/data";
import type { MobiStation } from "@/types";
import { Progress } from "@/components/ui/progress";

type StationDetailPanelProps = {
  station?: MobiStation | null;
  /** "t12" or a four-digit year string; when set, shows a note if the
   *  station had no recorded trips in that specific year. */
  year?: string;
};

export function StationDetailPanel({ station, year }: StationDetailPanelProps) {
  if (!station) {
    return (
      <div className="flex h-full flex-col justify-center rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium tracking-tight text-foreground">
          Select a station
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a Mobi station on the map to inspect its transit connector
          score, trip profile, and top destinations.
        </p>
      </div>
    );
  }

  const generatedStation = stationsArtifact.stations.find((s) => s.id === station.id);
  const hasNoTripsInYear =
    year && year !== "t12" && generatedStation
      ? (generatedStation.tripsByYear[year] ?? 0) === 0
      : false;

  return (
    <div className="h-full rounded-lg border border-border p-6">
      <p className="eyebrow">{station.label}</p>
      <h3 className="mt-3 text-xl font-medium tracking-tight text-foreground">
        {station.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{station.area}</p>

      {hasNoTripsInYear && (
        <p className="mt-2 text-xs text-muted-foreground">
          No recorded trips in {year}.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Trailing 12 months
      </p>

      <div className="mt-6 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Transit connector score
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {station.connectorScore}/100
          </span>
        </div>
        <Progress
          value={station.connectorScore}
          className="h-1.5"
          aria-label="Transit connector score"
        />
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
        <Stat label="Monthly trips" value={station.monthlyTrips.toLocaleString("en-CA")} />
        <Stat label="E-bike share" value={`${station.ebikeShare}%`} />
        <Stat label="Trip volume" value={station.tripVolume} />
      </dl>

      {/* A trend needs two points; stations born this year don't have them yet. */}
      {station.trend.length >= 2 && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">Trips per year since first seen</p>
          <div className="mt-2">
            <MiniTrendChart
              ariaLabel="Yearly trip trend chart"
              data={station.trend}
            />
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">Top destinations</p>
        <ul className="mt-2 space-y-1.5">
          {station.topDestinations.map((destination) => (
            <li key={destination} className="text-sm font-medium text-foreground">
              {destination}
            </li>
          ))}
        </ul>
      </div>

      <StationFacts stationId={station.id} />
    </div>
  );
}

function StationFacts({ stationId }: { stationId: string }) {
  const generated = stationsArtifact.stations.find((s) => s.id === stationId);
  if (!generated) return null;

  return (
    <dl className="mt-6 space-y-1.5 border-t border-border pt-6 text-sm">
      {generated.capacity ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Docks</dt>
          <dd className="font-medium text-foreground tabular-nums">{generated.capacity}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Nearest rapid transit</dt>
        <dd className="text-right font-medium text-foreground">
          {generated.nearestTransit.name}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">In the data since</dt>
        <dd className="font-medium text-foreground tabular-nums">{generated.firstSeen}</dd>
      </div>
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}
