import { ImageResponse } from "next/og";
import { lifeBudgetIconElement } from "@/lib/pwa-icon";

export function GET() {
  return new ImageResponse(lifeBudgetIconElement(192), {
    width: 192,
    height: 192,
  });
}
