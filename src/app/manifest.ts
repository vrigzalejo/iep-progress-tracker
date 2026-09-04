import type { MetadataRoute } from "next";
import { APP_NAME, APP_SLUG } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_SLUG,
    description: "Log IEP progress sessions from the hallway. Offline queue stays on this device.",
    start_url: "/today",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#123d31",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
