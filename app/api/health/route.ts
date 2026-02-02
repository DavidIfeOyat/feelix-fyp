export function GET() {
  return Response.json({ ok: true, service: "feelix", ts: Date.now() });
}