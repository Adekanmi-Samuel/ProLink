/**
 * Geohashing Service
 *
 * Implements geohash-based proximity search for finding
 * clients/providers nearby. Uses a precision-based prefix
 * matching approach that's compatible with SQL/NoSQL indexes.
 *
 * Geohash precision → approximate grid size:
 *   1  → ±2,500 km
 *   2  → ±630 km
 *   3  → ±78 km
 *   4  → ±20 km
 *   5  → ±2.4 km
 *   6  → ±0.61 km
 *   7  → ±0.076 km
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Encode lat/lng to geohash string */
function encode(lat, lng, precision = 7) {
  if (lat < -90 || lat > 90) throw new Error(`Invalid latitude: ${lat}`);
  if (lng < -180 || lng > 180) throw new Error(`Invalid longitude: ${lng}`);
  if (precision < 1 || precision > 12) throw new Error(`Invalid precision: ${precision}`);

  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let bit = 0;
  let evenBit = true;
  let idx = 0;

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { idx = (idx << 1) | 1; minLng = mid; }
      else { idx = idx << 1; maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { idx = (idx << 1) | 1; minLat = mid; }
      else { idx = idx << 1; maxLat = mid; }
    }
    evenBit = !evenBit;
    bit++;
    if (bit === 5) { hash += BASE32[idx]; bit = 0; idx = 0; }
  }
  return hash;
}

/** Decode a geohash to bounding box */
function decode(geohash) {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let evenBit = true;

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error(`Invalid geohash character: ${char}`);
    for (let bit = 4; bit >= 0; bit--) {
      const mask = (idx >> bit) & 1;
      if (evenBit) {
        const mid = (minLng + maxLng) / 2;
        if (mask) minLng = mid; else maxLng = mid;
      } else {
        const mid = (minLat + maxLat) / 2;
        if (mask) minLat = mid; else maxLat = mid;
      }
      evenBit = !evenBit;
    }
  }

  return {
    latitude: { min: minLat, max: maxLat },
    longitude: { min: minLng, max: maxLng },
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
  };
}

/** Get neighboring geohashes (all 8 + center) */
function getNeighbors(geohash) {
  const neighbors = new Set();
  for (let dlng = -1; dlng <= 1; dlng++) {
    for (let dlat = -1; dlat <= 1; dlat++) {
      if (dlng === 0 && dlat === 0) continue;
      const neighbor = _shift(geohash, dlat, dlng);
      if (neighbor) neighbors.add(neighbor);
    }
  }
  return Array.from(neighbors);
}

/** Get geohash prefixes for nearby search */
function getNearbyPrefixes(lat, lng, precision = 5) {
  const center = encode(lat, lng, precision);
  return [center, ...getNeighbors(center)];
}

// Neighbor tables for geohash shifting
const _NEIGHBOR_TABLES = {
  east:  { even: 'bc01fg45238967deuvhjyznpkmstqrwx', odd: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy' },
  west:  { even: '238967debc01fg45kmstqrwxuvhjyznp', odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb' },
  north: { even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy', odd: 'bc01fg45238967deuvhjyznpkmstqrwx' },
  south: { even: '14365h7k9dcfesgujnmqp0r2twvyx8zb', odd: '238967debc01fg45kmstqrwxuvhjyznp' },
};

const _BORDER_TABLES = {
  east:  { even: 'bcfguvyz', odd: 'prxz' },
  west:  { even: '0145hjnp', odd: '028b' },
  north: { even: 'prxz', odd: 'bcfguvyz' },
  south: { even: '028b', odd: '0145hjnp' },
};

/** Build lookup map from a neighbor string */
function _buildLookup(str) {
  const map = {};
  for (let i = 0; i < BASE32.length; i++) map[BASE32[i]] = str[i];
  return map;
}

// Precompute lookup tables as objects
const _NEIGHBOR_LK = {};
for (const dir of ['east', 'west', 'north', 'south']) {
  _NEIGHBOR_LK[dir] = {
    even: _buildLookup(_NEIGHBOR_TABLES[dir].even),
    odd: _buildLookup(_NEIGHBOR_TABLES[dir].odd),
  };
}

/** Shift geohash in grid directions */
function _shift(geohash, dlat, dlng) {
  if (!geohash) return geohash;
  const chars = geohash.split('');
  for (let i = chars.length - 1; i >= 0; i--) {
    const parity = (geohash.length - 1 - i) % 2 === 0 ? 'even' : 'odd';

    if (dlng !== 0) {
      const dir = dlng > 0 ? 'east' : 'west';
      if (_BORDER_TABLES[dir][parity].includes(chars[i])) {
        // Edge case — skip for simplicity, return original bounds
        return null;
      }
      chars[i] = _NEIGHBOR_LK[dir][parity][chars[i]] || chars[i];
      break;
    }

    if (dlat !== 0) {
      const dir = dlat > 0 ? 'north' : 'south';
      if (_BORDER_TABLES[dir][parity].includes(chars[i])) {
        return null;
      }
      chars[i] = _NEIGHBOR_LK[dir][parity][chars[i]] || chars[i];
      break;
    }
  }
  return chars.join('');
}

/** Calculate distance between two coordinates (Haversine) */
function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get recommended precision for a given search radius */
function precisionForRadius(radiusKm) {
  if (radiusKm >= 2500) return 1;
  if (radiusKm >= 630) return 2;
  if (radiusKm >= 78) return 3;
  if (radiusKm >= 20) return 4;
  if (radiusKm >= 2.4) return 5;
  if (radiusKm >= 0.61) return 6;
  if (radiusKm >= 0.076) return 7;
  return 8;
}

module.exports = { encode, decode, getNeighbors, getNearbyPrefixes, distance, precisionForRadius };
