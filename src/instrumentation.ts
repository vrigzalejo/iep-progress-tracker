import { captureError } from "@/lib/monitoring";

export function onRequestError(error: Error) {
  captureError(error, { source: "request" });
}
