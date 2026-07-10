// Data contracts for the pipeline-generated artifacts in src/data/generated/.
// These types are the interface between the offline Python/DuckDB pipeline
// and the app; src/data/generated.test.ts locks the JSON to these shapes.

export type Meta = {
  generatedAt: string;
  sourceWindow: { firstMonth: string; lastMonth: string };
  totals: {
    trips: number;
    distanceKm: number;
    years: number;
    activeStations: number;
    ebikeSharePctLatestYear: number | null;
  };
  quality: {
    rowsLanded: number;
    filesProcessed: number;
    rowsKept: number;
    droppedBlankStations: number;
    droppedBadTimestamp: number;
    droppedDuplicates: number;
    rowsFlagged: number;
    stationIdCoveragePctT12: number;
    unknownMembershipTrips: number;
  };
  sources: { trips: string; gbfs: string; cityOfVancouver: string };
};

export type YearlyRow = {
  year: number;
  trips: number;
  distanceKm: number;
  medianDurationMin: number;
  ebikeSharePct: number | null;
  activeStations: number;
  avgDepartureTempC: number | null;
  membershipMix: Record<string, number>;
};

export type MonthlyRow = {
  month: string; // YYYY-MM
  trips: number;
  ebikeTrips: number | null; // null before the e-bike flag exists in the source
};

export type SeasonalityRow = { year: number; tripsByMonth: number[] };

export type HourlyRow = { year: number; weekday: number[]; weekend: number[] };

export type WeatherRow = { tempBandC: number; trips: number; daysObserved: number };

export type StationDestination = { id: string; name: string; trips: number };

export type GeneratedStation = {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lon: number;
  capacity: number | null;
  firstSeen: string; // YYYY-MM
  tripsByYear: Record<string, number>;
  trailing12: {
    trips: number;
    ebikeSharePct: number | null;
    commuteSharePct: number;
    weekendSharePct: number;
    distinctDestinations: number;
    topDestinations: StationDestination[];
  };
  nearestTransit: { name: string; distanceM: number };
  connector: {
    score: number;
    components: {
      transitProximity: number;
      tripVolume: number;
      commutePattern: number;
      ebikeShare: number;
      destinationDiversity: number;
    };
  };
};

export type TransitStation = {
  name: string;
  line: "Canada Line" | "SkyTrain";
  area: string | null;
  lat: number;
  lon: number;
};

export type StationsArtifact = {
  stations: GeneratedStation[];
  transit: TransitStation[];
};

export type FlowProfile = { dep: number[]; ret: number[] }; // 24 hourly slots each

export type StationFlows = {
  id: string;
  avgDailyNet: number; // returns - departures, averaged over active days
  avgAbsDailyNet: number;
  avgPeakSwing: number; // avg max intraday cumulative imbalance
  weekday: FlowProfile;
  weekend: FlowProfile;
};

export type FlowsArtifact = {
  networkDailyRebalancing: number; // implied bikes/day crews must move
  weekdayCount: number; // weekday days in the trailing-12-month window
  weekendCount: number;
  stations: StationFlows[];
};

export type ForecastArtifact = {
  modelCard: {
    station: string;
    features: string[];
    constraint: string;
    trainRange: string;
    testRange: string;
    nTrain: number;
    nTest: number;
    testMae: number;
    baselineMae: number;
    testR2: number;
  };
  tempBandsC: number[];
  rainLevelsMm: number[];
  // [month-1][0=weekday,1=weekend][tempIdx][rainIdx] -> predicted daily trips
  grid: number[][][][];
};

export type OpportunityRule =
  | "dock-capacity-pressure"
  | "ebike-gap"
  | "transit-connector-gap"
  | "seasonal-underuse";

export type GeneratedOpportunity = {
  rank: number;
  stationId: string;
  stationName: string;
  rule: OpportunityRule;
  type: string;
  priority: "High" | "Medium" | "Low";
  evidence: Record<string, number | string>;
};
