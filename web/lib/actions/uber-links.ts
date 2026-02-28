export function buildUberDeepLink(address: string): string {
  const encodedAddress = encodeURIComponent(address.trim());
  return `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodedAddress}`;
}

