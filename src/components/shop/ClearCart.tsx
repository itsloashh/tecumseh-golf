"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Empties the cart when a shopper lands on their new order (incl. returning from Stripe). */
export function ClearCartOnArrival() {
  const { clear } = useStore();
  useEffect(() => { clear(); }, [clear]);
  return null;
}
