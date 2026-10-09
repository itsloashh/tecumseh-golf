import type { Order } from "./types";

/** Safe to import in the browser. */
export const STATUS_LABEL: Record<Order["status"], string> = {
  awaiting_payment: "Awaiting payment",
  new: "Received",
  ready: "Ready for pickup",
  completed: "Picked up",
  cancelled: "Cancelled",
};
