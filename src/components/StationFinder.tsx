import { stationsArtifact } from "@/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StationFinderProps = {
  selectedStationId?: string | null;
  onStationSelect: (stationId: string) => void;
};

const sortedStations = [...stationsArtifact.stations].sort((a, b) =>
  a.name.localeCompare(b.name, "en-CA"),
);

// Keyboard- and screen-reader-first station selection: fitter for 262
// stations than tab-cycling map dots, and it doubles as search for everyone.
export function StationFinder({
  selectedStationId,
  onStationSelect,
}: StationFinderProps) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">Find a station</span>
      <Select value={selectedStationId ?? ""} onValueChange={onStationSelect}>
        <SelectTrigger aria-label="Find a station" className="mt-2 w-full">
          <SelectValue placeholder="All stations" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {sortedStations.map((station) => (
            <SelectItem key={station.id} value={station.id}>
              {station.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
