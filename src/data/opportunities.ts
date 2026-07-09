import type { Opportunity } from "@/types";

export const opportunities: Opportunity[] = [
  {
    rank: 1,
    stationId: "hornby-and-pender",
    area: "Downtown",
    type: "Prioritize e-bikes",
    reason: "49% of departures use e-bikes, making this station a strong candidate for e-bike availability planning.",
    priority: "High"
  },
  {
    rank: 2,
    stationId: "cardero-and-davie",
    area: "Yaletown",
    type: "Prioritize e-bikes",
    reason: "49% of departures use e-bikes, making this station a strong candidate for e-bike availability planning.",
    priority: "High"
  },
  {
    rank: 3,
    stationId: "dunsmuir-and-richards",
    area: "Downtown",
    type: "Prioritize e-bikes",
    reason: "53% of departures use e-bikes, making this station a strong candidate for e-bike availability planning.",
    priority: "High"
  },
  {
    rank: 4,
    stationId: "stanley-park-information-booth",
    area: "West End",
    type: "Prioritize e-bikes",
    reason: "55% of departures use e-bikes, making this station a strong candidate for e-bike availability planning.",
    priority: "High"
  },
  {
    rank: 5,
    stationId: "davie-and-beach",
    area: "Yaletown",
    type: "Promote as transit connector",
    reason: "The station is estimated near yaletown roundhouse but has room to grow as a connector.",
    priority: "Medium"
  },
  {
    rank: 6,
    stationId: "science-world",
    area: "False Creek",
    type: "Promote as transit connector",
    reason: "The station is estimated near main street science world but has room to grow as a connector.",
    priority: "Medium"
  }
];

