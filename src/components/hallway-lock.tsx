"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const PIN_KEY = "iep-hallway-pin";
const UNLOCK_KEY = "iep-hallway-unlocked";

const listeners = new Set<() => void>();

function subscribeLock(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyLock() {
  listeners.forEach((listener) => listener());
}

function hasStoredPin() {
  return Boolean(localStorage.getItem(PIN_KEY));
}

function isLocked() {
  return hasStoredPin() && sessionStorage.getItem(UNLOCK_KEY) !== "1";
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export function HallwayLock() {
  const hasPin = useSyncExternalStore(subscribeLock, hasStoredPin, () => false);
  const locked = useSyncExternalStore(subscribeLock, isLocked, () => false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function setNewPin() {
    if (pin.length < 4) {
      setError("Use at least 4 digits.");
      return;
    }
    localStorage.setItem(PIN_KEY, await digest(pin));
    sessionStorage.setItem(UNLOCK_KEY, "1");
    notifyLock();
    setPin("");
    setError(null);
  }

  async function unlock() {
    const stored = localStorage.getItem(PIN_KEY);
    if (!stored || stored !== (await digest(pin))) {
      setError("That PIN does not match.");
      return;
    }
    sessionStorage.setItem(UNLOCK_KEY, "1");
    notifyLock();
    setPin("");
    setError(null);
  }

  function clearPin() {
    localStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
    notifyLock();
    setPin("");
  }

  if (locked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/95 p-6 text-white">
        <form
          className="w-full max-w-sm space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void unlock();
          }}
        >
          <h2 className="font-serif text-2xl">Hallway lock</h2>
          <p className="text-sm text-white/80">Enter the device PIN to continue logging on this shared iPad.</p>
          <Label htmlFor="hallway-pin" className="text-white">
            PIN
          </Label>
          <Input
            id="hallway-pin"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="min-h-12 bg-white text-ink"
          />
          {error ? <p className="text-sm text-[#f7efd6]">{error}</p> : null}
          <Button type="submit" className="w-full min-h-12">
            Unlock
          </Button>
        </form>
      </div>
    );
  }

  return (
    <details className="rounded-lg border border-border bg-white p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Optional device PIN</summary>
      <p className="mt-2 text-muted">
        Stored only on this browser for a shared cart. It is not a student password and does not replace sign-in.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor="set-pin">PIN</Label>
          <Input
            id="set-pin"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void setNewPin()}>
          {hasPin ? "Change PIN" : "Set PIN"}
        </Button>
        {hasPin ? (
          <Button type="button" variant="ghost" onClick={clearPin}>
            Remove PIN
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-terracotta">{error}</p> : null}
    </details>
  );
}
