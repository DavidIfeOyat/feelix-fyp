// Lightweight operational route used for quick backend checks.
// This is useful for deployment validation or confirming that the app is responding.

export function GET() {
  return Response.json({
    ok: true,
    service: "feelix",
    ts: Date.now(),
  });
}