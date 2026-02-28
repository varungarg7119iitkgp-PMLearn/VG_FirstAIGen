export function buildGoogleMapsUrl(name: string, address: string): string {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

