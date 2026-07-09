import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceMonths = [
  {
    id: "april-2026",
    label: "April 2026",
    fileName: "public-trips-3.0-2026-04.csv",
    defaultPath: path.join(root, "data-raw", "public-trips-3.0-2026-04.csv"),
    fallbackPath: "/tmp/mobi-2026-04.csv",
    sourceUrl:
      "https://drive.google.com/file/d/1SgVj92gqvFwPtwY5E-M8QnN_rgiSazsU/view?usp=sharing",
  },
  {
    id: "may-2026",
    label: "May 2026",
    fileName: "public-trips-3.0-2026-05.csv",
    defaultPath: path.join(root, "data-raw", "public-trips-3.0-2026-05.csv"),
    fallbackPath: "/tmp/mobi-2026-05.csv",
    sourceUrl:
      "https://drive.google.com/file/d/1Jhn1Rr3KQjALu886PcqmMY5WQYkqr9vD/view?usp=sharing",
  },
];

const transitNodes = [
  { id: "waterfront", name: "Waterfront", x: 44, y: 18 },
  { id: "yaletown-roundhouse", name: "Yaletown-Roundhouse", x: 39, y: 42 },
  { id: "olympic-village", name: "Olympic Village", x: 48, y: 58 },
  { id: "main-street-science-world", name: "Main Street-Science World", x: 56, y: 49 },
  { id: "broadway-city-hall", name: "Broadway-City Hall", x: 45, y: 66 },
  { id: "commercial-broadway", name: "Commercial-Broadway", x: 76, y: 54 },
  { id: "vcc-clark", name: "VCC-Clark", x: 69, y: 47 },
];

const transitKeywordRules = [
  {
    node: "main-street-science-world",
    score: 96,
    keywords: ["science world", "terminal", "quebec", "union", "keefer"],
  },
  {
    node: "yaletown-roundhouse",
    score: 90,
    keywords: ["yaletown", "marinaside", "mainland", "hamilton", "davie", "pacific"],
  },
  {
    node: "waterfront",
    score: 88,
    keywords: ["waterfront", "cordova", "pender", "dunsmuir", "granville", "burrard", "seymour"],
  },
  {
    node: "olympic-village",
    score: 84,
    keywords: ["olympic", "manitoba", "creekside", "seawall", "granville island", "1st"],
  },
  {
    node: "broadway-city-hall",
    score: 82,
    keywords: ["broadway", "10th", "12th", "laurel", "willow", "cambie"],
  },
  {
    node: "commercial-broadway",
    score: 80,
    keywords: ["commercial", "trout lake"],
  },
  {
    node: "vcc-clark",
    score: 78,
    keywords: ["vcc", "clark", "great northern"],
  },
];

const timeBuckets = [
  { key: "lateNight", label: "Late night", test: (hour) => hour < 6 || hour >= 22 },
  { key: "morning", label: "Morning commute", test: (hour) => hour >= 6 && hour < 10 },
  { key: "midday", label: "Midday", test: (hour) => hour >= 10 && hour < 16 },
  { key: "evening", label: "Evening commute", test: (hour) => hour >= 16 && hour < 20 },
  { key: "night", label: "Evening", test: (hour) => hour >= 20 && hour < 22 },
];

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const processedMonths = sourceMonths.map((month) => {
  const explicitPath = args.get(`--${month.id}`) ?? args.get(`--${month.id.split("-")[0]}`);
  const filePath = resolveSourcePath(explicitPath, month);
  const rows = readCsv(filePath);

  return processMonth(month, rows, filePath);
});

const maxTripVolume = Math.max(
  ...processedMonths.flatMap((month) => [...month.stationAgg.values()].map((station) => station.departures)),
);
const maxConnectivity = Math.max(
  ...processedMonths.flatMap((month) => [...month.stationAgg.values()].map((station) => station.destinations.size)),
);

const stationsByMonth = Object.fromEntries(
  processedMonths.map((month) => [
    month.id,
    buildStationsForMonth(month, maxTripVolume, maxConnectivity),
  ]),
);

const latestMonth = processedMonths.at(-1);
const latestStations = stationsByMonth[latestMonth.id];

writeTsFile(
  "src/data/stations.ts",
  `import type { MobiMonthId, MobiStation } from "@/types";

export const stationsByMonth: Record<MobiMonthId, MobiStation[]> = ${toTs(stationsByMonth)};

export const stations: MobiStation[] = stationsByMonth["${latestMonth.id}"];
`,
);

writeTsFile(
  "src/data/opportunities.ts",
  `import type { Opportunity } from "@/types";

export const opportunities: Opportunity[] = ${toTs(buildOpportunities(latestStations))};
`,
);

writeTsFile(
  "src/data/realMobi.ts",
  `import type { RealMobiDataSummary } from "@/types";

export const realMobiDataSummary: RealMobiDataSummary = ${toTs(
    buildRealMobiDataSummary(processedMonths, stationsByMonth),
  )};
`,
);

console.log(
  JSON.stringify(
    {
      months: processedMonths.map((month) => ({
        id: month.id,
        trips: month.totalTrips,
        stations: month.stationAgg.size,
      })),
      output: ["src/data/stations.ts", "src/data/opportunities.ts", "src/data/realMobi.ts"],
    },
    null,
    2,
  ),
);

function resolveSourcePath(explicitPath, month) {
  const candidates = [explicitPath, month.defaultPath, month.fallbackPath].filter(Boolean);
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    throw new Error(
      `Missing ${month.label} CSV. Put ${month.fileName} in data-raw/ or pass --${month.id} /path/to/file.csv.`,
    );
  }

  return filePath;
}

function readCsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function processMonth(month, rows, filePath) {
  const hourlyDepartures = Array.from({ length: 24 }, () => 0);
  const timeOfDay = Object.fromEntries(timeBuckets.map((bucket) => [bucket.key, 0]));
  const stationAgg = new Map();
  let ebikeTrips = 0;
  let weekendTrips = 0;
  let commuteTrips = 0;
  let totalDistance = 0;
  let totalDuration = 0;

  for (const row of rows) {
    const departureStation = normalizeStationName(row["Departure station"]);
    const returnStation = normalizeStationName(row["Return station"]);

    if (!departureStation || !returnStation) {
      continue;
    }

    const departureDate = new Date(row.Departure.replace(" ", "T"));
    const hour = Number.isNaN(departureDate.getTime()) ? 0 : departureDate.getHours();
    const day = Number.isNaN(departureDate.getTime()) ? 1 : departureDate.getDay();
    const isWeekend = day === 0 || day === 6;
    const isCommute = (hour >= 6 && hour < 10) || (hour >= 16 && hour < 20);
    const isEbike = row["Electric bike"] === "True";
    const distance = Number(row["Covered distance (m)"]) || 0;
    const duration = Number(row["Duration (sec.)"]) || 0;

    hourlyDepartures[hour] += 1;
    timeBuckets.find((bucket) => bucket.test(hour)).key;
    timeOfDay[timeBuckets.find((bucket) => bucket.test(hour)).key] += 1;

    if (isEbike) ebikeTrips += 1;
    if (isWeekend) weekendTrips += 1;
    if (isCommute) commuteTrips += 1;
    totalDistance += distance;
    totalDuration += duration;

    const station = getStationAgg(stationAgg, departureStation);
    station.departures += 1;
    station.ebikeTrips += isEbike ? 1 : 0;
    station.weekendTrips += isWeekend ? 1 : 0;
    station.commuteTrips += isCommute ? 1 : 0;
    station.distance += distance;
    station.duration += duration;
    station.destinations.set(returnStation, (station.destinations.get(returnStation) ?? 0) + 1);
  }

  const totalTrips = [...stationAgg.values()].reduce((sum, station) => sum + station.departures, 0);

  return {
    ...month,
    filePath,
    totalTrips,
    ebikeTrips,
    classicTrips: totalTrips - ebikeTrips,
    weekendTrips,
    commuteTrips,
    totalDistance,
    totalDuration,
    hourlyDepartures,
    timeOfDay,
    stationAgg,
  };
}

function getStationAgg(stationAgg, name) {
  if (!stationAgg.has(name)) {
    stationAgg.set(name, {
      name,
      departures: 0,
      ebikeTrips: 0,
      weekendTrips: 0,
      commuteTrips: 0,
      distance: 0,
      duration: 0,
      destinations: new Map(),
    });
  }

  return stationAgg.get(name);
}

function normalizeStationName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function buildStationsForMonth(month, maxTripVolume, maxConnectivity) {
  const scored = [...month.stationAgg.values()]
    .filter((station) => station.departures >= 120)
    .map((station) => toMobiStation(station, month, maxTripVolume, maxConnectivity))
    .sort((a, b) => b.connectorScore - a.connectorScore || b.monthlyTrips - a.monthlyTrips);

  return scored.slice(0, 12).map((station, index) => ({
    ...station,
    x: clamp(station.x + (index % 3) * 1.8 - 1.8, 12, 88),
    y: clamp(station.y + Math.floor(index / 3) * 1.6 - 2.4, 10, 82),
  }));
}

function toMobiStation(station, month, maxTripVolume, maxConnectivity) {
  const transitMatch = inferTransitMatch(station.name);
  const tripVolumeScore = normalize(station.departures, 0, maxTripVolume);
  const commuteRatio = station.departures ? station.commuteTrips / station.departures : 0;
  const commutePattern = clamp(Math.round(commuteRatio * 190), 0, 100);
  const ebikeShare = Math.round((station.ebikeTrips / station.departures) * 100);
  const stationConnectivity = normalize(station.destinations.size, 0, maxConnectivity);
  const transitProximity = transitMatch.score;
  const connectorScore = Math.round(
    transitProximity * 0.3 +
      tripVolumeScore * 0.25 +
      commutePattern * 0.2 +
      ebikeShare * 0.1 +
      stationConnectivity * 0.15,
  );
  const node = transitNodes.find((item) => item.id === transitMatch.node);
  const topDestinations = [...station.destinations.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([destination]) => stripStationCode(destination));
  const monthlyTrend = sourceMonths.map((sourceMonth) => {
    if (sourceMonth.id === month.id) {
      return station.departures;
    }

    const peerMonth = processedMonths.find((item) => item.id === sourceMonth.id);
    return peerMonth?.stationAgg.get(station.name)?.departures ?? 0;
  });

  return {
    id: slugify(station.name),
    name: stripStationCode(station.name),
    sourceStationName: station.name,
    area: inferArea(station.name),
    x: node.x + deterministicOffset(station.name, "x"),
    y: node.y + deterministicOffset(station.name, "y"),
    nearbyTransitNode: transitMatch.node,
    connectorScore,
    monthlyTrips: station.departures,
    tripsNearTransitPercentage: transitProximity,
    ebikeShare,
    label: inferLabel(station.name, connectorScore, ebikeShare, transitProximity, tripVolumeScore),
    topDestinations,
    tripVolume: tripVolumeScore >= 65 ? "High" : tripVolumeScore >= 35 ? "Medium" : "Low",
    commuteStrength: commutePattern >= 70 ? "High" : commutePattern >= 45 ? "Medium" : "Low",
    bikeTypeSplit: { classic: 100 - ebikeShare, ebike: ebikeShare },
    trend: monthlyTrend,
    connectorScoreComponents: {
      transitProximity,
      tripVolume: tripVolumeScore,
      commutePattern,
      ebikeShare,
      stationConnectivity,
    },
  };
}

function inferTransitMatch(stationName) {
  const lower = stationName.toLowerCase();

  for (const rule of transitKeywordRules) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return { node: rule.node, score: rule.score };
    }
  }

  return { node: "olympic-village", score: 52 };
}

function inferArea(stationName) {
  const lower = stationName.toLowerCase();

  if (lower.includes("stanley") || lower.includes("denman") || lower.includes("bute") || lower.includes("comox")) {
    return "West End";
  }

  if (lower.includes("kits") || lower.includes("arbutus") || lower.includes("cypress")) {
    return "Kitsilano";
  }

  if (lower.includes("science world") || lower.includes("creekside") || lower.includes("seawall") || lower.includes("manitoba")) {
    return "False Creek";
  }

  if (lower.includes("commercial") || lower.includes("vcc") || lower.includes("clark")) {
    return "East Vancouver";
  }

  if (lower.includes("broadway") || lower.includes("10th") || lower.includes("12th")) {
    return "Fairview";
  }

  if (lower.includes("davie") || lower.includes("marinaside") || lower.includes("yaletown")) {
    return "Yaletown";
  }

  if (lower.includes("granville island")) {
    return "Granville Island";
  }

  return "Downtown";
}

function inferLabel(stationName, connectorScore, ebikeShare, transitProximity, tripVolumeScore) {
  const lower = stationName.toLowerCase();

  if (connectorScore >= 78) return "Strong connector";
  if (ebikeShare >= 50) return "E-bike opportunity";
  if (transitProximity >= 78 && tripVolumeScore < 45) return "Underused near transit";
  if (lower.includes("stanley") || lower.includes("kitsilano")) return "Recreation-heavy";
  return "Expansion opportunity";
}

function buildOpportunities(stations) {
  return stations
    .map((station) => {
      if (station.connectorScore >= 82) {
        return {
          station,
          type: "Increase dock capacity",
          priority: "High",
          reason: `${station.name} combines ${station.monthlyTrips.toLocaleString("en-CA")} real May departures with a ${station.connectorScore}/100 connector score.`,
        };
      }

      if (station.ebikeShare >= 48) {
        return {
          station,
          type: "Prioritize e-bikes",
          priority: "High",
          reason: `${station.ebikeShare}% of departures use e-bikes, making this station a strong candidate for e-bike availability planning.`,
        };
      }

      if (station.tripsNearTransitPercentage >= 80 && station.tripVolume !== "High") {
        return {
          station,
          type: "Promote as transit connector",
          priority: "Medium",
          reason: `The station is estimated near ${station.nearbyTransitNode.replaceAll("-", " ")} but has room to grow as a connector.`,
        };
      }

      return {
        station,
        type: station.label === "Recreation-heavy" ? "Monitor demand" : "Already well served",
        priority: station.label === "Recreation-heavy" ? "Medium" : "Low",
        reason: `Real Mobi trips show ${station.area} demand that should be monitored before adding capacity.`,
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || b.station.connectorScore - a.station.connectorScore)
    .slice(0, 6)
    .map((item, index) => ({
      rank: index + 1,
      stationId: item.station.id,
      area: item.station.area,
      type: item.type,
      reason: item.reason,
      priority: item.priority,
    }));
}

function buildRealMobiDataSummary(months, stationsByMonth) {
  const labels = months.map((month) => month.label);
  const combinedTrips = months.reduce((sum, month) => sum + month.totalTrips, 0);
  const combinedEbike = months.reduce((sum, month) => sum + month.ebikeTrips, 0);
  const latest = months.at(-1);
  const latestStations = stationsByMonth[latest.id];

  return {
    sourceName: "Mobi by Rogers System Data",
    sourceUrl: "https://www.mobibikes.ca/en/system-data",
    licenseUrl: "https://storage.googleapis.com/mobibikes-public-data/licence/Mobi_System_Data_License.pdf",
    months: months.map((month) => ({
      id: month.id,
      label: month.label,
      fileName: month.fileName,
      sourceUrl: month.sourceUrl,
      trips: month.totalTrips,
      stations: month.stationAgg.size,
      ebikeTrips: month.ebikeTrips,
      classicTrips: month.classicTrips,
    })),
    charts: {
      monthlyTrips: {
        labels,
        trips: months.map((month) => month.totalTrips),
        ebikeTrips: months.map((month) => month.ebikeTrips),
        classicTrips: months.map((month) => month.classicTrips),
      },
      hourlyDepartures: {
        labels: Array.from({ length: 24 }, (_, hour) => `${hour}:00`),
        series: months.map((month) => ({
          label: month.label,
          data: month.hourlyDepartures,
        })),
      },
      bikeTypeSplit: {
        labels: ["Classic", "E-bike"],
        data: [combinedTrips - combinedEbike, combinedEbike],
      },
      topStations: {
        labels: latestStations.slice(0, 8).map((station) => station.name),
        data: latestStations.slice(0, 8).map((station) => station.monthlyTrips),
      },
      timeOfDay: {
        labels: timeBuckets.map((bucket) => bucket.label),
        data: timeBuckets.map((bucket) => latest.timeOfDay[bucket.key] ?? 0),
      },
    },
    notes: [
      "Trip times are rounded to the nearest hour in the source data.",
      "Accounts are anonymized by the data publisher.",
      "Operations trips for rebalancing and maintenance are removed by the data publisher.",
      "The public trip CSVs do not include station coordinates, so transit proximity is estimated from station names and nearby transit landmarks.",
    ],
  };
}

function stripStationCode(stationName) {
  return stationName.replace(/^\d+\s+/, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/^\d+\s+/, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(value, min, max) {
  if (max <= min) return 0;
  return clamp(Math.round(((value - min) / (max - min)) * 100), 0, 100);
}

function deterministicOffset(value, salt) {
  const hash = [...`${value}:${salt}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ((hash % 13) - 6) * 1.6;
}

function priorityRank(priority) {
  return { High: 0, Medium: 1, Low: 2 }[priority];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function writeTsFile(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), `${content}\n`);
}

function toTs(value) {
  return JSON.stringify(value, null, 2)
    .replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, "$1:")
    .replace(/"([A-Z][A-Za-z ]+)"/g, '"$1"');
}
