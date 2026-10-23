import { act } from "@/lib/raahi";

export async function POST(request: Request) {
  const { type, ...payload } = (await request.json()) as { type: string } & Record<string, unknown>;
  const result = act(type, payload);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
