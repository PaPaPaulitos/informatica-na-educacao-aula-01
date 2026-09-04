import { jsonNoStore } from "@/lib/http";
import { getPublicState, usingRedis } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const state = await getPublicState();
  return jsonNoStore({
    ...state,
    persistence: usingRedis() ? "redis" : "memory",
  });
}
