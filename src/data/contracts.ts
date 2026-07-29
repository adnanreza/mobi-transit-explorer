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
  avgTempC: number | null; // annual mean Environment Canada ambient temperature
  membershipMix: Record<string, number>;
};

export type MonthlyRow = {
  month: string; // YYYY-MM
  trips: number;
  ebikeTrips: number | null; // null before the e-bike flag exists in the source
};

export type SeasonalityRow = { year: number; tripsByMonth: (number | null)[] };

export type HourlyRow = { year: number; weekday: number[]; weekend: number[] };

// tripsPerDay = average total network trips on days whose EC ambient mean
// temperature falls in this 2-degree band
export type WeatherRow = { tempBandC: number; tripsPerDay: number; daysObserved: number };

export type StationDestination = { id: string; name: string; trips: number };

export type GeneratedStation = {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lon: number;
  capacity: number | null;
  firstSeen: string; // YYYY-MM
  leisureSharePct: number | null; // trailing-12-month heuristic, null if unclassified
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
    gridReferenceYear: number; // demand level the widget's grid reflects
    gridFitRange: string;
    droppedDays: {
      total: number;
      trainingWindow: number; // days dropped in the 2017-2024 fitting window
      holdoutWindow: number;  // days dropped in the 2025+ evaluation window
      perYear: Record<string, number>;
    };
  };
  tempBandsC: number[];
  rainLevelsMm: number[];
  monthMeanTempRangeC: Record<string, [number, number]>; // "1".."12" -> [min, max] observed
  // [month-1][0=weekday,1=weekend][tempIdx][rainIdx] -> predicted daily trips
  grid: number[][][][];
};

export type EbikeCompare = {
  trips: number;
  medianDurationMin: number;
  medianDistanceKm: number;
  medianSpeedKmh: number;
  medianDetour: number;
};

export type EbikeArtifact = {
  since: string; // first month the e-bike flag exists
  compare: { classic: EbikeCompare; ebike: EbikeCompare };
  shareByTempBand: { tempBandC: number; ebikeSharePct: number }[];
  purpose: {
    leisureSharePct: number;
    classifiedTrips: number;
    definition: string;
  };
};

export type SmokeDay = {
  date: string;
  pm25: number; // daily mean at the primary station, ug/m3
  trips: number;
  dropPct: number | null; // vs clear days in the same year+month; null when too few
};

export type AirQualityArtifact = {
  primaryStation: string;
  corroboratingStation: string;
  smokeThresholdUgM3: number;
  verifiedThrough: string; // last day covered by BC ENV verified data
  coverage: { firstDay: string | null; lastDay: string | null; days: number };
  smokeDayCount: number;
  avgSmokeDayDropPct: number | null; // mean of per-day drops vs same-month clear days
  medianSmokeDayDropPct: number | null; // the typical smoke day, robust to the 2020 event
  worstDay: SmokeDay | null;
  events: { year: number; days: number; avgDropPct: number | null }[];
  sept2020: { date: string; trips: number; pm25: number; smoke: boolean }[];
};

// Reported cyclist-involved crashes near each dock (spec 046). All cyclists,
// not Mobi riders, and deliberately no per-trip rate: see the artifact's
// licence block and the methodology for why.
export type CrashContextArtifact = {
  source: { workbook: string; catalogueRecord: string; accessedAt: string };
  licence: {
    name: string;
    version: string;
    url: string;
    attribution: string; // required verbatim, apostrophe is U+2019
    disclaimer: string; // required wherever analysis is drawn
  };
  vintage: { from: number; to: number; revisable: boolean };
  radiusM: number;
  city: {
    rows: number; // source rows, which are weighted
    crashes: number; // sum of TOTAL_CRASHES
    casualtyCrashes: number;
    propertyDamageOnlyCrashes: number;
    crashesWithCoordinates: number;
    crashesWithoutCoordinates: number;
    withCoordinatesPct: number | null;
    medianStationCrashes: number | null; // the typical dock, as an anchor
  };
  accounting: {
    matchedUniqueCrashes: number;
    nearNoStationCrashes: number;
    stationAssignments: number; // exceeds matchedUnique: catchments overlap
    crashesMatchingMultipleStations: number;
  };
  // the chosen radius is a judgement, so the alternatives ship with it
  radiusSensitivity: {
    radiusM: number;
    matchedUniqueCrashes: number;
    stationsWithNone: number;
  }[];
  byStation: Record<string, { crashes: number; casualtyCrashes: number }>;
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
