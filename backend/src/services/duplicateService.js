const Issue = require('../models/Issue');

const NEARBY_RADIUS_METERS = 100;

/**
 * Looks for existing open issues of the same category within NEARBY_RADIUS_METERS
 * of the given coordinates. Used to warn citizens before they file a duplicate report.
 */
async function findNearbyDuplicates({ longitude, latitude, category, excludeIssueId = null }) {
  const query = {
    category,
    status: { $nin: ['RESOLVED', 'REJECTED'] },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: NEARBY_RADIUS_METERS,
      },
    },
  };
  if (excludeIssueId) query._id = { $ne: excludeIssueId };

  const candidates = await Issue.find(query)
    .limit(5)
    .select('issueId title status upvoteCount location createdAt')
    .lean();

  return candidates.map((issue) => ({
    ...issue,
    distanceMeters: haversineDistance(
      latitude,
      longitude,
      issue.location.coordinates[1],
      issue.location.coordinates[0]
    ),
  }));
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

module.exports = { findNearbyDuplicates };
