import type { MobiMonthId, MobiStation } from "@/types";

export const stationsByMonth: Record<MobiMonthId, MobiStation[]> = {
  "april-2026": [
    {
      id: "science-world",
      name: "Science World",
      sourceStationName: "0193 Science World",
      area: "False Creek",
      x: 46.2,
      y: 40.2,
      nearbyTransitNode: "main-street-science-world",
      connectorScore: 71,
      monthlyTrips: 1044,
      tripsNearTransitPercentage: 96,
      ebikeShare: 24,
      label: "Underused near transit",
      topDestinations: [
        "Science World",
        "Granville Island",
        "Spyglass & Seawall"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 76,
        ebike: 24
      },
      trend: [
        1044,
        1303
      ],
      connectorScoreComponents: {
        transitProximity: 96,
        tripVolume: 28,
        commutePattern: 100,
        ebikeShare: 24,
        stationConnectivity: 83
      }
    },
    {
      id: "davie-and-beach",
      name: "Davie & Beach",
      sourceStationName: "0028 Davie & Beach",
      area: "Yaletown",
      x: 30.999999999999996,
      y: 33.2,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 70,
      monthlyTrips: 1487,
      tripsNearTransitPercentage: 90,
      ebikeShare: 51,
      label: "E-bike opportunity",
      topDestinations: [
        "Davie & Beach",
        "Stanley Park - Second Beach South",
        "Morton & Denman"
      ],
      tripVolume: "Medium",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 49,
        ebike: 51
      },
      trend: [
        1487,
        1984
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 40,
        commutePattern: 83,
        ebikeShare: 51,
        stationConnectivity: 72
      }
    },
    {
      id: "dunsmuir-and-richards",
      name: "Dunsmuir & Richards",
      sourceStationName: "0012 Dunsmuir & Richards",
      area: "Downtown",
      x: 47.400000000000006,
      y: 18.8,
      nearbyTransitNode: "waterfront",
      connectorScore: 69,
      monthlyTrips: 739,
      tripsNearTransitPercentage: 88,
      ebikeShare: 55,
      label: "E-bike opportunity",
      topDestinations: [
        "Dunsmuir & Richards",
        "Richards & Davie",
        "Smithe & Burrard"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 45,
        ebike: 55
      },
      trend: [
        739,
        807
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 20,
        commutePattern: 100,
        ebikeShare: 55,
        stationConnectivity: 78
      }
    },
    {
      id: "hornby-and-pender",
      name: "Hornby & Pender",
      sourceStationName: "0024 Hornby & Pender",
      area: "Downtown",
      x: 32.6,
      y: 10,
      nearbyTransitNode: "waterfront",
      connectorScore: 68,
      monthlyTrips: 857,
      tripsNearTransitPercentage: 88,
      ebikeShare: 47,
      label: "Underused near transit",
      topDestinations: [
        "Hornby & Pender",
        "Bute & Davie",
        "Hornby & Drake"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 53,
        ebike: 47
      },
      trend: [
        857,
        996
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 23,
        commutePattern: 100,
        ebikeShare: 47,
        stationConnectivity: 77
      }
    },
    {
      id: "richards-and-davie",
      name: "Richards & Davie",
      sourceStationName: "0082 Richards & Davie",
      area: "Yaletown",
      x: 48.6,
      y: 31.6,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 68,
      monthlyTrips: 695,
      tripsNearTransitPercentage: 90,
      ebikeShare: 46,
      label: "Underused near transit",
      topDestinations: [
        "Richards & Davie",
        "Richards & Robson",
        "Dunsmuir & Beatty"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 54,
        ebike: 46
      },
      trend: [
        695,
        798
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 19,
        commutePattern: 96,
        ebikeShare: 46,
        stationConnectivity: 82
      }
    },
    {
      id: "granville-island",
      name: "Granville Island",
      sourceStationName: "0189 Granville Island",
      area: "Granville Island",
      x: 53.800000000000004,
      y: 26.800000000000004,
      nearbyTransitNode: "waterfront",
      connectorScore: 67,
      monthlyTrips: 943,
      tripsNearTransitPercentage: 88,
      ebikeShare: 41,
      label: "Underused near transit",
      topDestinations: [
        "Granville Island",
        "Science World",
        "Ontario & Seawall"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 59,
        ebike: 41
      },
      trend: [
        943,
        1223
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 25,
        commutePattern: 89,
        ebikeShare: 41,
        stationConnectivity: 80
      }
    },
    {
      id: "dunsmuir-and-beatty",
      name: "Dunsmuir & Beatty",
      sourceStationName: "0005 Dunsmuir & Beatty",
      area: "Downtown",
      x: 40.6,
      y: 18.8,
      nearbyTransitNode: "waterfront",
      connectorScore: 67,
      monthlyTrips: 850,
      tripsNearTransitPercentage: 88,
      ebikeShare: 41,
      label: "Underused near transit",
      topDestinations: [
        "Dunsmuir & Beatty",
        "Union & Dunlevy",
        "Richards & Davie"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 59,
        ebike: 41
      },
      trend: [
        850,
        1068
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 23,
        commutePattern: 90,
        ebikeShare: 41,
        stationConnectivity: 83
      }
    },
    {
      id: "broughton-and-davie",
      name: "Broughton & Davie",
      sourceStationName: "0087 Broughton & Davie",
      area: "Yaletown",
      x: 45.4,
      y: 50.800000000000004,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 67,
      monthlyTrips: 439,
      tripsNearTransitPercentage: 90,
      ebikeShare: 74,
      label: "E-bike opportunity",
      topDestinations: [
        "Broughton & Davie",
        "Smithe & Burrard",
        "Hornby & Pender"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 26,
        ebike: 74
      },
      trend: [
        439,
        570
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 12,
        commutePattern: 100,
        ebikeShare: 74,
        stationConnectivity: 66
      }
    },
    {
      id: "ontario-and-seawall",
      name: "Ontario & Seawall",
      sourceStationName: "0011 Ontario & Seawall",
      area: "False Creek",
      x: 41.800000000000004,
      y: 52.400000000000006,
      nearbyTransitNode: "olympic-village",
      connectorScore: 66,
      monthlyTrips: 1051,
      tripsNearTransitPercentage: 84,
      ebikeShare: 30,
      label: "Underused near transit",
      topDestinations: [
        "Ontario & Seawall",
        "Marinaside & Davie",
        "Carrall & Seawall"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 70,
        ebike: 30
      },
      trend: [
        1051,
        1421
      ],
      connectorScoreComponents: {
        transitProximity: 84,
        tripVolume: 28,
        commutePattern: 92,
        ebikeShare: 30,
        stationConnectivity: 83
      }
    },
    {
      id: "bute-and-davie",
      name: "Bute & Davie",
      sourceStationName: "0187 Bute & Davie",
      area: "West End",
      x: 35.6,
      y: 44.4,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 66,
      monthlyTrips: 977,
      tripsNearTransitPercentage: 90,
      ebikeShare: 46,
      label: "Underused near transit",
      topDestinations: [
        "Bute & Davie",
        "Hornby & Pender",
        "Smithe & Burrard"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 54,
        ebike: 46
      },
      trend: [
        977,
        781
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 26,
        commutePattern: 90,
        ebikeShare: 46,
        stationConnectivity: 69
      }
    },
    {
      id: "1st-and-manitoba",
      name: "1st & Manitoba",
      sourceStationName: "0174 1st & Manitoba",
      area: "False Creek",
      x: 51.2,
      y: 65.19999999999999,
      nearbyTransitNode: "olympic-village",
      connectorScore: 66,
      monthlyTrips: 881,
      tripsNearTransitPercentage: 84,
      ebikeShare: 34,
      label: "Underused near transit",
      topDestinations: [
        "1st & Manitoba",
        "Wylie & 2nd",
        "Olympic Village Station"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 66,
        ebike: 34
      },
      trend: [
        881,
        984
      ],
      connectorScoreComponents: {
        transitProximity: 84,
        tripVolume: 24,
        commutePattern: 99,
        ebikeShare: 34,
        stationConnectivity: 78
      }
    },
    {
      id: "smithe-and-burrard",
      name: "Smithe & Burrard",
      sourceStationName: "0217 Smithe & Burrard",
      area: "Downtown",
      x: 49.00000000000001,
      y: 25.200000000000003,
      nearbyTransitNode: "waterfront",
      connectorScore: 66,
      monthlyTrips: 875,
      tripsNearTransitPercentage: 88,
      ebikeShare: 56,
      label: "E-bike opportunity",
      topDestinations: [
        "Smithe & Burrard",
        "Haro & Denman",
        "Cardero & Davie"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 44,
        ebike: 56
      },
      trend: [
        875,
        939
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 23,
        commutePattern: 86,
        ebikeShare: 56,
        stationConnectivity: 71
      }
    }
  ],
  "may-2026": [
    {
      id: "davie-and-beach",
      name: "Davie & Beach",
      sourceStationName: "0028 Davie & Beach",
      area: "Yaletown",
      x: 29.2,
      y: 33.2,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 74,
      monthlyTrips: 1984,
      tripsNearTransitPercentage: 90,
      ebikeShare: 46,
      label: "Expansion opportunity",
      topDestinations: [
        "Davie & Beach",
        "Morton & Denman",
        "Stanley Park - Third Beach Parking Lot"
      ],
      tripVolume: "Medium",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 54,
        ebike: 46
      },
      trend: [
        1487,
        1984
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 53,
        commutePattern: 77,
        ebikeShare: 46,
        stationConnectivity: 92
      }
    },
    {
      id: "science-world",
      name: "Science World",
      sourceStationName: "0193 Science World",
      area: "False Creek",
      x: 48,
      y: 40.2,
      nearbyTransitNode: "main-street-science-world",
      connectorScore: 72,
      monthlyTrips: 1303,
      tripsNearTransitPercentage: 96,
      ebikeShare: 25,
      label: "Underused near transit",
      topDestinations: [
        "Science World",
        "Marinaside & Davie",
        "Granville Island"
      ],
      tripVolume: "Medium",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 75,
        ebike: 25
      },
      trend: [
        1044,
        1303
      ],
      connectorScoreComponents: {
        transitProximity: 96,
        tripVolume: 35,
        commutePattern: 94,
        ebikeShare: 25,
        stationConnectivity: 88
      }
    },
    {
      id: "ontario-and-seawall",
      name: "Ontario & Seawall",
      sourceStationName: "0011 Ontario & Seawall",
      area: "False Creek",
      x: 41.800000000000004,
      y: 49.2,
      nearbyTransitNode: "olympic-village",
      connectorScore: 70,
      monthlyTrips: 1421,
      tripsNearTransitPercentage: 84,
      ebikeShare: 29,
      label: "Underused near transit",
      topDestinations: [
        "Ontario & Seawall",
        "Marinaside & Davie",
        "Granville Island"
      ],
      tripVolume: "Medium",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 71,
        ebike: 29
      },
      trend: [
        1051,
        1421
      ],
      connectorScoreComponents: {
        transitProximity: 84,
        tripVolume: 38,
        commutePattern: 87,
        ebikeShare: 29,
        stationConnectivity: 100
      }
    },
    {
      id: "hornby-and-pender",
      name: "Hornby & Pender",
      sourceStationName: "0024 Hornby & Pender",
      area: "Downtown",
      x: 32.6,
      y: 10,
      nearbyTransitNode: "waterfront",
      connectorScore: 70,
      monthlyTrips: 996,
      tripsNearTransitPercentage: 88,
      ebikeShare: 49,
      label: "Underused near transit",
      topDestinations: [
        "Hornby & Pender",
        "Hornby & Drake",
        "Bute & Davie"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 51,
        ebike: 49
      },
      trend: [
        857,
        996
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 27,
        commutePattern: 100,
        ebikeShare: 49,
        stationConnectivity: 81
      }
    },
    {
      id: "granville-island",
      name: "Granville Island",
      sourceStationName: "0189 Granville Island",
      area: "Granville Island",
      x: 52,
      y: 26.800000000000004,
      nearbyTransitNode: "waterfront",
      connectorScore: 69,
      monthlyTrips: 1223,
      tripsNearTransitPercentage: 88,
      ebikeShare: 43,
      label: "Underused near transit",
      topDestinations: [
        "Granville Island",
        "Science World",
        "Ontario & Seawall"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 57,
        ebike: 43
      },
      trend: [
        943,
        1223
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 33,
        commutePattern: 88,
        ebikeShare: 43,
        stationConnectivity: 86
      }
    },
    {
      id: "dunsmuir-and-beatty",
      name: "Dunsmuir & Beatty",
      sourceStationName: "0005 Dunsmuir & Beatty",
      area: "Downtown",
      x: 44.2,
      y: 17.200000000000003,
      nearbyTransitNode: "waterfront",
      connectorScore: 69,
      monthlyTrips: 1068,
      tripsNearTransitPercentage: 88,
      ebikeShare: 32,
      label: "Underused near transit",
      topDestinations: [
        "Dunsmuir & Beatty",
        "Beatty & Nelson",
        "Union & Dunlevy"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 68,
        ebike: 32
      },
      trend: [
        850,
        1068
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 29,
        commutePattern: 98,
        ebikeShare: 32,
        stationConnectivity: 85
      }
    },
    {
      id: "1st-and-manitoba",
      name: "1st & Manitoba",
      sourceStationName: "0174 1st & Manitoba",
      area: "False Creek",
      x: 49.400000000000006,
      y: 63.6,
      nearbyTransitNode: "olympic-village",
      connectorScore: 69,
      monthlyTrips: 984,
      tripsNearTransitPercentage: 84,
      ebikeShare: 39,
      label: "Underused near transit",
      topDestinations: [
        "1st & Manitoba",
        "Olympic Village Station",
        "Wylie & 2nd"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 61,
        ebike: 39
      },
      trend: [
        881,
        984
      ],
      connectorScoreComponents: {
        transitProximity: 84,
        tripVolume: 26,
        commutePattern: 97,
        ebikeShare: 39,
        stationConnectivity: 94
      }
    },
    {
      id: "cardero-and-davie",
      name: "Cardero & Davie",
      sourceStationName: "0040 Cardero & Davie",
      area: "Yaletown",
      x: 47,
      y: 52.400000000000006,
      nearbyTransitNode: "yaletown-roundhouse",
      connectorScore: 69,
      monthlyTrips: 866,
      tripsNearTransitPercentage: 90,
      ebikeShare: 49,
      label: "Underused near transit",
      topDestinations: [
        "Cardero & Davie",
        "Cardero & Robson",
        "Bute & Robson"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 51,
        ebike: 49
      },
      trend: [
        679,
        866
      ],
      connectorScoreComponents: {
        transitProximity: 90,
        tripVolume: 23,
        commutePattern: 100,
        ebikeShare: 49,
        stationConnectivity: 75
      }
    },
    {
      id: "dunsmuir-and-richards",
      name: "Dunsmuir & Richards",
      sourceStationName: "0012 Dunsmuir & Richards",
      area: "Downtown",
      x: 47.400000000000006,
      y: 22,
      nearbyTransitNode: "waterfront",
      connectorScore: 69,
      monthlyTrips: 807,
      tripsNearTransitPercentage: 88,
      ebikeShare: 53,
      label: "E-bike opportunity",
      topDestinations: [
        "Richards & Davie",
        "Dunsmuir & Richards",
        "Pacific & Richards"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 47,
        ebike: 53
      },
      trend: [
        739,
        807
      ],
      connectorScoreComponents: {
        transitProximity: 88,
        tripVolume: 22,
        commutePattern: 100,
        ebikeShare: 53,
        stationConnectivity: 81
      }
    },
    {
      id: "stanley-park-information-booth",
      name: "Stanley Park - Information Booth",
      sourceStationName: "0209 Stanley Park - Information Booth",
      area: "West End",
      x: 46.2,
      y: 62.00000000000001,
      nearbyTransitNode: "olympic-village",
      connectorScore: 68,
      monthlyTrips: 3747,
      tripsNearTransitPercentage: 52,
      ebikeShare: 55,
      label: "E-bike opportunity",
      topDestinations: [
        "Stanley Park - Information Booth",
        "Stanley Park - Totem Poles",
        "Stanley Park - Second Beach North"
      ],
      tripVolume: "High",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 45,
        ebike: 55
      },
      trend: [
        2793,
        3747
      ],
      connectorScoreComponents: {
        transitProximity: 52,
        tripVolume: 100,
        commutePattern: 74,
        ebikeShare: 55,
        stationConnectivity: 47
      }
    },
    {
      id: "keefer-and-abbott",
      name: "Keefer & Abbott",
      sourceStationName: "0053 Keefer & Abbott",
      area: "Downtown",
      x: 57.6,
      y: 54.6,
      nearbyTransitNode: "main-street-science-world",
      connectorScore: 68,
      monthlyTrips: 953,
      tripsNearTransitPercentage: 96,
      ebikeShare: 29,
      label: "Underused near transit",
      topDestinations: [
        "Keefer & Abbott",
        "Union & Dunlevy",
        "Ontario & Seawall"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 71,
        ebike: 29
      },
      trend: [
        661,
        953
      ],
      connectorScoreComponents: {
        transitProximity: 96,
        tripVolume: 25,
        commutePattern: 90,
        ebikeShare: 29,
        stationConnectivity: 80
      }
    },
    {
      id: "union-and-dunlevy",
      name: "Union & Dunlevy",
      sourceStationName: "0212 Union & Dunlevy",
      area: "Downtown",
      x: 56.2,
      y: 51.4,
      nearbyTransitNode: "main-street-science-world",
      connectorScore: 68,
      monthlyTrips: 857,
      tripsNearTransitPercentage: 96,
      ebikeShare: 40,
      label: "Underused near transit",
      topDestinations: [
        "Union & Dunlevy",
        "Keefer & Abbott",
        "Dunsmuir & Richards"
      ],
      tripVolume: "Low",
      commuteStrength: "High",
      bikeTypeSplit: {
        classic: 60,
        ebike: 40
      },
      trend: [
        651,
        857
      ],
      connectorScoreComponents: {
        transitProximity: 96,
        tripVolume: 23,
        commutePattern: 93,
        ebikeShare: 40,
        stationConnectivity: 71
      }
    }
  ]
};

export const stations: MobiStation[] = stationsByMonth["may-2026"];

