import { useState } from "react";
import { forecast } from "@/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const RAIN_LABELS: Record<number, string> = {
  0: "Dry",
  2: "Light rain (2 mm)",
  10: "Rainy (10 mm)",
  25: "Pouring (25 mm)",
};

// A lookup into the precomputed prediction grid — no ML runs in the browser.
export function WeatherModelBlock() {
  const [month, setMonth] = useState(6); // July
  const [dayType, setDayType] = useState<0 | 1>(1); // weekend
  const [tempIdx, setTempIdx] = useState(
    forecast.tempBandsC.indexOf(22) === -1 ? 5 : forecast.tempBandsC.indexOf(22),
  );
  const [rainIdx, setRainIdx] = useState(0);

  const trips = forecast.grid[month][dayType][tempIdx][rainIdx];
  const card = forecast.modelCard;

  // Flag month/temperature combinations Vancouver has never recorded (e.g. a
  // 22°C January) rather than showing a confident extrapolated number.
  const selectedTempC = forecast.tempBandsC[tempIdx];
  const monthRange = forecast.monthMeanTempRangeC[String(month + 1)];
  const outOfRange =
    monthRange !== undefined &&
    (selectedTempC < Math.floor(monthRange[0]) || selectedTempC > Math.ceil(monthRange[1]));
  const monthName = MONTHS[month];

  return (
    <div>
      <div className="grid gap-3 border-t border-border pt-10 sm:grid-cols-4">
        <Picker
          label="Month"
          value={String(month)}
          onChange={(v) => setMonth(Number(v))}
          options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
        />
        <Picker
          label="Day type"
          value={String(dayType)}
          onChange={(v) => setDayType(Number(v) as 0 | 1)}
          options={[
            { value: "0", label: "Weekday" },
            { value: "1", label: "Weekend day" },
          ]}
        />
        <Picker
          label="Temperature"
          value={String(tempIdx)}
          onChange={(v) => setTempIdx(Number(v))}
          options={forecast.tempBandsC.map((t, i) => ({
            value: String(i),
            label: `${t}°C`,
          }))}
        />
        <Picker
          label="Rain"
          value={String(rainIdx)}
          onChange={(v) => setRainIdx(Number(v))}
          options={forecast.rainLevelsMm.map((r, i) => ({
            value: String(i),
            label: RAIN_LABELS[r] ?? `${r} mm`,
          }))}
        />
      </div>

      {outOfRange ? (
        <p className="mt-8 max-w-xl text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
          No {monthName} on record has averaged {selectedTempC}°C
          <span className="text-muted-foreground"> — outside the observed range, so the model won't guess.</span>
        </p>
      ) : (
        <>
          <p className="mt-8 text-4xl font-medium tracking-[-0.02em] text-foreground tabular-nums sm:text-5xl">
            ≈ {trips.toLocaleString("en-CA")}{" "}
            <span className="text-xl font-normal text-muted-foreground sm:text-2xl">
              trips on a day like this
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            at {card.gridReferenceYear} network size
          </p>
        </>
      )}

      <p className="mt-6 max-w-2xl text-xs leading-5 text-muted-foreground">
        Model card: {card.features.length} features; {card.constraint}. Evaluated
        by a time split — trained on {card.nTrain.toLocaleString("en-CA")} days
        through 2024, tested on {card.nTest.toLocaleString("en-CA")} unseen days
        ({card.testRange}): mean error {card.testMae.toLocaleString("en-CA")}{" "}
        trips/day vs {card.baselineMae.toLocaleString("en-CA")} for a
        seasonal-naive baseline, R² {card.testR2}. The predictions above come
        from a model refit on all data through {card.gridFitRange.split(" to ").pop()} and
        reflect {card.gridReferenceYear} demand levels. Weather from{" "}
        {card.station}. Predictions are only meaningful within each month's
        historically observed temperature range, and never fall below the fewest
        trips ever seen in a day. Associations, not causal claims — the data has
        no events, and holidays are a single flag.
      </p>
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="mt-2 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
