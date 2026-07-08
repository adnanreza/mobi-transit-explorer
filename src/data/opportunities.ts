import type { Opportunity } from "@/types";

export const opportunities: Opportunity[] = [
  {
    rank: 1,
    stationId: "mobi-0012",
    area: "Mount Pleasant",
    type: "Add station nearby",
    reason:
      "High e-bike share and medium commute strength suggest unmet demand west of Broadway-City Hall.",
    priority: "High",
  },
  {
    rank: 2,
    stationId: "mobi-0006",
    area: "Grandview-Woodland",
    type: "Prioritize e-bikes",
    reason:
      "Trips connect to VCC-Clark but the corridor has hills and longer cross-neighborhood rides.",
    priority: "High",
  },
  {
    rank: 3,
    stationId: "mobi-0007",
    area: "East Vancouver",
    type: "Increase dock capacity",
    reason:
      "Commercial-Broadway is a strong connector with high monthly trips and high transit adjacency.",
    priority: "High",
  },
  {
    rank: 4,
    stationId: "mobi-0011",
    area: "Strathcona",
    type: "Promote as transit connector",
    reason:
      "The station is near Main Street-Science World but remains underused relative to nearby nodes.",
    priority: "Medium",
  },
  {
    rank: 5,
    stationId: "mobi-0008",
    area: "Kitsilano",
    type: "Monitor demand",
    reason:
      "Recreation-heavy usage is seasonal and less connected to rapid transit commute patterns.",
    priority: "Medium",
  },
  {
    rank: 6,
    stationId: "mobi-0001",
    area: "Downtown",
    type: "Already well served",
    reason:
      "Waterfront has strong trip volume and transit proximity, so near-term focus should be reliability.",
    priority: "Low",
  },
];
