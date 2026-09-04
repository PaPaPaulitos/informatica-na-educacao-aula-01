import { jsonNoStore } from "@/lib/http";
import { getPublicState } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return jsonNoStore(await getPublicState());
}
