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

export const travelPeriods: TravelPeriod[] = [
  { start: "2026-04-14", end: "2026-04-14", city: "SF", label: "Day trip" },
  { start: "2026-04-27", end: "2026-05-08", city: "SF", label: "Work trip" },
  { start: "2026-05-10", end: "2026-05-15", city: "SF", label: "Work trip" },
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
    departure: "18:25",
    arrival: "19:57",
    departureAirport: "SFO",
    arrivalAirport: "LAX",
  },
  {
    id: "3",
    date: "2026-05-10",
    direction: "LA → SF",
    flightNumber: "AA2345",
    airline: "American Airlines",
    departure: "07:00",
    arrival: "08:20",
    departureAirport: "LAX",
    arrivalAirport: "SFO",
  },
  {
    id: "4",
    date: "2026-05-15",
    direction: "SF → LA",
    flightNumber: "AA6789",
    airline: "American Airlines",
    departure: "18:00",
    arrival: "19:20",
    departureAirport: "SFO",
    arrivalAirport: "LAX",
  },
];
