export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flight = searchParams.get("flight");
  const date = searchParams.get("date");

  if (!flight || !date) {
    return Response.json({ error: "Missing flight or date" }, { status: 400 });
  }

  const apiKey = process.env.AVIATIONSTACK_KEY;
  if (!apiKey) {
    return Response.json({ error: "AVIATIONSTACK_KEY not configured" }, { status: 500 });
  }

  const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flight.toUpperCase())}&flight_date=${encodeURIComponent(date)}`;

  const res = await fetch(url);
  if (!res.ok) {
    return Response.json({ error: "AviationStack request failed" }, { status: 502 });
  }

  const json = await res.json();
  const results = json?.data;

  if (!results || results.length === 0) {
    return Response.json({ error: "Flight not found" }, { status: 404 });
  }

  const f = results[0];

  // Parse scheduled departure/arrival times to HH:MM
  function toHHMM(iso: string | null): string {
    if (!iso) return "TBD";
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : "TBD";
  }

  return Response.json({
    airline: f.airline?.name ?? "Unknown",
    flightNumber: f.flight?.iata ?? flight.toUpperCase(),
    departure: toHHMM(f.departure?.scheduled),
    arrival: toHHMM(f.arrival?.scheduled),
    departureAirport: f.departure?.iata ?? "",
    arrivalAirport: f.arrival?.iata ?? "",
  });
}
