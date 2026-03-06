"use client";

/**
 * Address autocomplete: solo dos fuentes.
 * - Si existe NEXT_PUBLIC_GOOGLE_PLACES_API_KEY → Google Places (mejor para LaBelle/FL).
 * - Si no → Photon / OpenStreetMap (gratis, sin API key).
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PHOTON_API = "https://photon.komoot.io/api/";
const GOOGLE_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export interface AddressSuggestion {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  autoFocus?: boolean;
}

/** Maps city name to our CITIES select values (LABELLE, LEHIGH) */
export function normalizeCityForSelect(cityName: string): string | undefined {
  const u = cityName.toUpperCase().replace(/\s+/g, " ").trim();
  if (u.includes("LABELLE") || u === "LABELLE") return "LABELLE";
  if (u.includes("LEHIGH") || u.startsWith("LEHIGH")) return "LEHIGH";
  return undefined;
}

// ─── Google Places (mejor datos para LaBelle / Florida) ─────────────────────

interface GoogleMapsWindow {
  google?: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          opts?: { componentRestrictions?: { country: string }; types?: string[] }
        ) => {
          addListener: (event: string, cb: () => void) => void;
          getPlace?: () => {
            formatted_address?: string;
            address_components?: Array<{
              long_name: string;
              short_name: string;
              types: string[];
            }>;
          };
        };
      };
      event?: { clearInstanceListeners: (instance: unknown) => void };
    };
  };
}

const getGoogle = (): GoogleMapsWindow["google"] =>
  typeof window !== "undefined"
    ? (window as unknown as GoogleMapsWindow).google
    : undefined;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getGoogle()?.maps?.places?.Autocomplete) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src^="${GOOGLE_SCRIPT_URL}"]`
    );
    if (existing) {
      if (getGoogle()?.maps?.places?.Autocomplete) {
        resolve();
        return;
      }
      (existing as HTMLScriptElement).addEventListener("load", () => resolve());
      (existing as HTMLScriptElement).addEventListener("error", () =>
        reject(new Error("Google script failed"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = `${GOOGLE_SCRIPT_URL}?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

// ─── Photon / OSM (fallback sin API key) ─────────────────────────────────────

interface PhotonFeature {
  type: string;
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

function formatPhotonAddress(f: PhotonFeature): {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const p = f.properties;
  const parts: string[] = [];
  if (p.housenumber) parts.push(p.housenumber);
  if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
  const streetLine = parts.length ? parts.join(" ") : p.name ?? "";
  const rest: string[] = [];
  if (p.city) rest.push(p.city);
  if (p.state) rest.push(p.state);
  if (p.postcode) rest.push(p.postcode);
  if (p.country && p.country !== "United States") rest.push(p.country);
  const full = rest.length ? `${streetLine}, ${rest.join(", ")}` : streetLine;
  return {
    address: full || (p.name ?? ""),
    city: p.city,
    state: p.state,
    zip: p.postcode,
  };
}

async function fetchPhotonSuggestions(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "6",
    lang: "en",
    bbox: "-125,24,-66,50",
  });

  const res = await fetch(`${PHOTON_API}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];
  const out: AddressSuggestion[] = [];

  for (const f of features) {
    const country = f.properties.country ?? "";
    if (country !== "United States" && country !== "") continue;
    const { address, city, state, zip } = formatPhotonAddress(f);
    if (!address) continue;
    const cityKey = city ? normalizeCityForSelect(city) : undefined;
    out.push({
      address,
      city: cityKey ?? city,
      state,
      zip,
    });
  }
  return out;
}

const DEBOUNCE_MS = 350;

// ─── Component ─────────────────────────────────────────────────────────────

export const AddressAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "e.g. 123 Main St, LaBelle, FL",
  disabled = false,
  id,
  className,
  autoFocus,
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [useGoogle, setUseGoogle] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      onChange(suggestion.address);
      if (onPlaceSelect) onPlaceSelect(suggestion);
      setSuggestions([]);
      setOpen(false);
      setHighlightIndex(-1);
    },
    [onChange, onPlaceSelect]
  );

  // Cargar Google cuando hay API key (mejor para LaBelle)
  useEffect(() => {
    if (!GOOGLE_API_KEY || disabled) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (!cancelled) setUseGoogle(true);
      })
      .catch(() => {
        if (!cancelled) setUseGoogle(false);
      });
    return () => {
      cancelled = true;
    };
  }, [disabled]);

  // Adjuntar Google Autocomplete al input cuando useGoogle y el input exista
  useEffect(() => {
    if (!useGoogle || !inputRef.current) return;
    const g = getGoogle();
    const Autocomplete = g?.maps?.places?.Autocomplete;
    if (!Autocomplete) return;

    const input = inputRef.current;
    const autocomplete = new Autocomplete(input, {
      componentRestrictions: { country: "us" },
      types: ["address"],
    });

    const listener = () => {
      const place = autocomplete.getPlace?.();
      if (!place) {
        selectSuggestion({ address: input.value });
        return;
      }
      const formatted = place.formatted_address ?? input.value;
      const components = place.address_components ?? [];
      let locality = "";
      let state = "";
      let zip = "";
      for (const c of components) {
        if (c.types.includes("locality")) locality = c.long_name;
        if (c.types.includes("administrative_area_level_1")) state = c.short_name;
        if (c.types.includes("postal_code")) zip = c.long_name;
      }
      const cityKey = locality ? normalizeCityForSelect(locality) : undefined;
      selectSuggestion({
        address: formatted,
        city: (cityKey ?? locality) || undefined,
        state: state || undefined,
        zip: zip || undefined,
      });
    };

    autocomplete.addListener("place_changed", listener);
    return () => {
      getGoogle()?.maps?.event?.clearInstanceListeners?.(autocomplete);
    };
  }, [useGoogle, selectSuggestion]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useGoogle) return;
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      return;
    }
    if (e.key === "Enter" && highlightIndex >= 0 && suggestions[highlightIndex]) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (useGoogle) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchPhotonSuggestions(v)
        .then((list) => {
          setSuggestions(list);
          setOpen(list.length > 0);
          setHighlightIndex(-1);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!useGoogle && suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoFocus={autoFocus}
        className={cn(className)}
        aria-label="Street address with autocomplete"
        aria-autocomplete={useGoogle ? "inline" : "list"}
        aria-expanded={open}
        aria-controls={useGoogle ? undefined : "address-suggestions"}
        aria-activedescendant={
          !useGoogle && highlightIndex >= 0 && suggestions[highlightIndex]
            ? `address-option-${highlightIndex}`
            : undefined
        }
      />

      {!useGoogle && open && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.address}-${i}`}
              id={`address-option-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-colors",
                i === highlightIndex
                  ? "bg-accent text-accent-foreground"
                  : "bg-popover text-popover-foreground hover:bg-accent/50"
              )}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
            >
              <span className="font-medium">{s.address}</span>
              {(s.city || s.state || s.zip) && (
                <span className="ml-1 text-muted-foreground">
                  {[s.city, s.state, s.zip].filter(Boolean).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!useGoogle && loading && (
        <div
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        >
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-current" />
        </div>
      )}
    </div>
  );
};
