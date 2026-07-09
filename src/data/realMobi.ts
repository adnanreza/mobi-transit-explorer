import type { RealMobiDataSummary } from "@/types";

export const realMobiDataSummary: RealMobiDataSummary = {
  sourceName: "Mobi by Rogers System Data",
  sourceUrl: "https://www.mobibikes.ca/en/system-data",
  licenseUrl: "https://storage.googleapis.com/mobibikes-public-data/licence/Mobi_System_Data_License.pdf",
  months: [
    {
      id: "april-2026",
      label: "April 2026",
      fileName: "public-trips-3.0-2026-04.csv",
      sourceUrl: "https://drive.google.com/file/d/1SgVj92gqvFwPtwY5E-M8QnN_rgiSazsU/view?usp=sharing",
      trips: 98505,
      stations: 263,
      ebikeTrips: 45523,
      classicTrips: 52982
    },
    {
      id: "may-2026",
      label: "May 2026",
      fileName: "public-trips-3.0-2026-05.csv",
      sourceUrl: "https://drive.google.com/file/d/1Jhn1Rr3KQjALu886PcqmMY5WQYkqr9vD/view?usp=sharing",
      trips: 126352,
      stations: 366,
      ebikeTrips: 55343,
      classicTrips: 71009
    }
  ],
  charts: {
    monthlyTrips: {
      labels: [
        "April 2026",
        "May 2026"
      ],
      trips: [
        98505,
        126352
      ],
      ebikeTrips: [
        45523,
        55343
      ],
      classicTrips: [
        52982,
        71009
      ]
    },
    hourlyDepartures: {
      labels: [
        "0:00",
        "1:00",
        "2:00",
        "3:00",
        "4:00",
        "5:00",
        "6:00",
        "7:00",
        "8:00",
        "9:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00",
        "23:00"
      ],
      series: [
        {
          label: "April 2026",
          data: [
            867,
            470,
            298,
            207,
            152,
            220,
            642,
            1726,
            4296,
            5135,
            4060,
            4604,
            5760,
            6513,
            6559,
            7402,
            8883,
            10633,
            9916,
            7486,
            5379,
            3359,
            2438,
            1500
          ]
        },
        {
          label: "May 2026",
          data: [
            1107,
            609,
            315,
            193,
            162,
            251,
            871,
            2178,
            5108,
            6151,
            5397,
            6110,
            7416,
            7887,
            8515,
            9387,
            11321,
            13283,
            12428,
            9488,
            7381,
            5644,
            3268,
            1882
          ]
        }
      ]
    },
    bikeTypeSplit: {
      labels: [
        "Classic",
        "E-bike"
      ],
      data: [
        123991,
        100866
      ]
    },
    topStations: {
      labels: [
        "Davie & Beach",
        "Science World",
        "Ontario & Seawall",
        "Hornby & Pender",
        "Granville Island",
        "Dunsmuir & Beatty",
        "1st & Manitoba",
        "Cardero & Davie"
      ],
      data: [
        1984,
        1303,
        1421,
        996,
        1223,
        1068,
        984,
        866
      ]
    },
    timeOfDay: {
      labels: [
        "Late night",
        "Morning commute",
        "Midday",
        "Evening commute",
        "Evening"
      ],
      data: [
        7787,
        14308,
        44712,
        46520,
        13025
      ]
    }
  },
  notes: [
    "Trip times are rounded to the nearest hour in the source data.",
    "Accounts are anonymized by the data publisher.",
    "Operations trips for rebalancing and maintenance are removed by the data publisher.",
    "The public trip CSVs do not include station coordinates, so transit proximity is estimated from station names and nearby transit landmarks."
  ]
};

