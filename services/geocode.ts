const cache = new Map<string, [number, number] | null>();

// Get rough bounding box for a destination to constrain results
async function getDestinationBounds(destination: string): Promise<{ lat: number; lon: number; countryCode: string } | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&featuretype=city,country,state`;
        const res = await fetch(url, { headers: { 'User-Agent': 'TripAI/1.0' } });
        const data = await res.json();
        if (!data.length) return null;
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            countryCode: data[0].address?.country_code || '',
        };
    } catch { return null; }
}

let destinationCache: { query: string; lat: number; lon: number; countryCode: string } | null = null;

export async function setDestinationContext(destination: string) {
    const bounds = await getDestinationBounds(destination);
    if (bounds) {
        destinationCache = { query: destination, ...bounds };
    }
}

export async function geocode(query: string, destination: string): Promise<[number, number] | null> {
    const cacheKey = `${destination}::${query}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    try {
        // Build URL with viewbox centered on destination (±2 degrees) + countrycodes
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', ' + destination)}&format=json&limit=3&addressdetails=1`;

        if (destinationCache && destinationCache.query === destination) {
            const { lat, lon, countryCode } = destinationCache;
            // Viewbox: ±1.5 degrees around destination center
            const d = 1.5;
            url += `&viewbox=${lon - d},${lat + d},${lon + d},${lat - d}&bounded=1`;
            if (countryCode) url += `&countrycodes=${countryCode}`;
        }

        const res = await fetch(url, { headers: { 'User-Agent': 'TripAI/1.0' } });
        const data = await res.json();

        if (!data.length) {
            // Fallback: search without bounded, but still with country
            if (destinationCache?.countryCode) {
                const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', ' + destination)}&format=json&limit=1&countrycodes=${destinationCache.countryCode}`;
                const res2 = await fetch(fallbackUrl, { headers: { 'User-Agent': 'TripAI/1.0' } });
                const data2 = await res2.json();
                if (data2.length) {
                    const coords: [number, number] = [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
                    cache.set(cacheKey, coords);
                    return coords;
                }
            }
            cache.set(cacheKey, null);
            return null;
        }

        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        cache.set(cacheKey, coords);
        return coords;
    } catch {
        cache.set(cacheKey, null);
        return null;
    }
}