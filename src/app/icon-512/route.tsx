import { ImageResponse } from "next/og";
import { lifeBudgetIconElement } from "@/lib/pwa-icon";

export function GET() {
  return new ImageResponse(lifeBudgetIconElement(512), {
    width: 512,
    height: 512,
  });
}
