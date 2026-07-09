export type StationLabel =
  | "Strong connector"
  | "E-bike opportunity"
  | "Underused near transit"
  | "Expansion opportunity"
  | "Recreation-heavy";

export type OpportunityType =
  | "Add station nearby"
  | "Increase dock capacity"
  | "Promote as transit connector"
  | "Prioritize e-bikes"
  | "Monitor demand"
  | "Already well served";

export type PriorityLevel = "High" | "Medium" | "Low";

export type TrendData = number[];

export type BikeTypeSplit = {
  classic: number;
  ebike: number;
};

export type ConnectorScoreComponents = {
  transitProximity: number;
  tripVolume: number;
  commutePattern: number;
  ebikeShare: number;
  stationConnectivity: number;
};

export type TransitNode = {
  id: string;
  name: string;
  mode: "SkyTrain" | "Canada Line" | "SeaBus" | "RapidBus" | "Bus exchange";
  area: string;
  x: number;
  y: number;
  dailyBoardings: number;
};

export type MobiStation = {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  nearbyTransitNode: string;
  connectorScore: number;
  monthlyTrips: number;
  tripsNearTransitPercentage: number;
  ebikeShare: number;
  label: StationLabel;
  topDestinations: string[];
  tripVolume: "Low" | "Medium" | "High";
  commuteStrength: "Low" | "Medium" | "High";
  bikeTypeSplit: BikeTypeSplit;
  trend: TrendData;
  connectorScoreComponents: ConnectorScoreComponents;
};

export type OverviewMetric = {
  id: string;
  label: string;
  value: string;
  caption: string;
  context?: string;
};

export type Opportunity = {
  rank: number;
  stationId: string;
  area: string;
  type: OpportunityType;
  reason: string;
  priority: PriorityLevel;
};
