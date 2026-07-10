const methodologyGroups = [
  {
    title: "Data sources",
    items: [
      "Every published Mobi by Rogers trip file from 2017 through today, plus the Mobi GBFS station feed and City of Vancouver open data.",
      "Raw files run through a staged local pipeline (Python + DuckDB) into compact JSON aggregates before deployment.",
      "Transit proximity is computed from real coordinates: GBFS station positions against City of Vancouver rapid-transit station locations.",
    ],
  },
  {
    title: "Connector score",
    items: [
      "Transit proximity",
      "Trip volume",
      "Commute pattern",
      "E-bike share",
      "Station connectivity",
    ],
  },
  {
    title: "Limitations",
    items: [
      "Public trip data is anonymized and cannot identify individual riders.",
      "Departure and return times are rounded to the nearest hour by the publisher.",
      "The source does not include exact route paths between stations.",
      "The publisher removes operations trips for rebalancing and maintenance.",
    ],
  },
  {
    title: "Future version",
    items: [
      "Tell the year-over-year story: growth, seasonality, the pandemic, e-bike adoption, and weather.",
      "Rebuild the explorer around per-year station histories.",
      "Publish the full data-quality report alongside the methodology.",
    ],
  },
];

export function Methodology() {
  return (
    <div className="grid gap-x-12 gap-y-12 border-t border-border pt-10 lg:grid-cols-2">
      {methodologyGroups.map((group) => (
        <section key={group.title}>
          <h3 className="text-lg font-medium tracking-tight text-foreground">
            {group.title}
          </h3>
          <ul className="mt-4 divide-y divide-border">
            {group.items.map((item) => (
              <li
                key={item}
                className="py-3 text-sm leading-6 text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
