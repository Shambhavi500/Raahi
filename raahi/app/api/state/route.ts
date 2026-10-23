import { getState } from "@/lib/raahi";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getState());
}
