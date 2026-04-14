// One-time cleanup: removes unbooked May 10–15 data from Supabase.
// Run with: node scripts/delete-may1015.mjs
// Delete this file after running.

const URL = "https://vfjwwzqjlisndpqxpvwv.supabase.co";
const KEY = "sb_publishable_tMdYLbSieTZbl_8AdGecCg_rgAhumDr";
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// Delete flights with id 3 or 4
const r1 = await fetch(`${URL}/rest/v1/flights?id=in.(3,4)`, { method: "DELETE", headers });
console.log("flights delete:", r1.status, r1.status === 204 ? "✓" : await r1.text());

// Delete the travel_period for May 10–15
const r2 = await fetch(`${URL}/rest/v1/travel_periods?start=eq.2026-05-10&end=eq.2026-05-15`, { method: "DELETE", headers });
console.log("travel_periods delete:", r2.status, r2.status === 204 ? "✓" : await r2.text());

console.log("\nDone. You can delete this file now.");
