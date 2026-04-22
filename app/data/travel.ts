export type TripStatus = "sf" | "la";

export interface Flight {
  id: string;
  date: string; // YYYY-MM-DD
  direction: "LA → SF" | "SF → LA";
  flightNumber: string;
  airline: string;
  departure: string; // HH:MM
  arrival: string;   // HH:MM
  departureAirport: string;
  arrivalAirport: string;
  notes?: string;
}

export interface TravelPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  city: "SF" | "LA";
  label?: string;
}

export interface PlannedRange {
  id: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  who: "nicolas" | "taylor";
}

export const travelPeriods: TravelPeriod[] = [
  { start: "2026-04-14", end: "2026-04-14", city: "SF", label: "Day trip" },
  { start: "2026-04-27", end: "2026-05-08", city: "SF", label: "Work trip" },
  // { start: "2026-05-10", end: "2026-05-15", city: "SF", label: "Work trip" }, // not yet booked
  // June trips — add when confirmed
];

export const taylorPeriods: TravelPeriod[] = [
  { start: "2026-05-01", end: "2026-05-08", city: "SF", label: "Taylor in SF" },
  // Add more when confirmed
];

export const flights: Flight[] = [
  {
    id: "0a",
    date: "2026-04-14",
    direction: "LA → SF",
    flightNumber: "DL1421",
    airline: "Delta Air Lines",
    departure: "06:20",
    arrival: "07:40",
    departureAirport: "LAX",
    arrivalAirport: "SFO",
  },
  {
    id: "0b",
    date: "2026-04-14",
    direction: "SF → LA",
    flightNumber: "DL2267",
    airline: "Delta Air Lines",
    departure: "16:17",
    arrival: "17:35",
    departureAirport: "SFO",
    arrivalAirport: "LAX",
  },
  {
    id: "1",
    date: "2026-04-27",
    direction: "LA → SF",
    flightNumber: "DL2267",
    airline: "Delta Air Lines",
    departure: "13:40",
    arrival: "15:03",
    departureAirport: "LAX",
    arrivalAirport: "SFO",
  },
  {
    id: "2",
    date: "2026-05-08",
    direction: "SF → LA",
    flightNumber: "DL1559",
    airline: "Delta Air Lines",
    departure: "20:29",
    arrival: "22:08",
    departureAirport: "SFO",
    arrivalAirport: "LAX",
  },
  // May 10–15 not yet booked — being planned
];
