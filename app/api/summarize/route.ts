import { summarize } from "../../../lib/generate";
import { summarizeRequestSchema } from "../../../lib/schema";

// Always 200. Any failure, including a bad request, returns { summary: null }.
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = summarizeRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ summary: null });

  try {
    return Response.json({ summary: await summarize(parsed.data.actions) });
  } catch (e) {
    console.error("summary failed:", e instanceof Error ? e.message : e);
    return Response.json({ summary: null });
  }
}
