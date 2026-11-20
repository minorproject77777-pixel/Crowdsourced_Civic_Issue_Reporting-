/**
 * Smart priority scoring.
 *
 * priorityScore = severityScore + voteScore + locationRisk + categoryWeight
 * Each component is capped so the total always sits in [0, 100].
 */

const CATEGORY_RISK_WEIGHT = {
  Pothole: 20,
  'Road Damage': 18,
  Sewage: 22,
  Drainage: 18,
  'Water Supply': 16,
  Streetlight: 10,
  Garbage: 12,
  'Public Toilet': 10,
  'Illegal Dumping': 12,
  Other: 8,
};

function calculatePriorityScore({ severity = 5, upvoteCount = 0, category = 'Other', ward = '' }) {
  const severityScore = Math.min(severity * 4, 40); // severity 1-10 -> up to 40
  const voteScore = Math.min(upvoteCount * 1.5, 20); // up to 20
  const categoryWeight = CATEGORY_RISK_WEIGHT[category] ?? 8; // up to ~22
  const locationRisk = ward ? 8 : 4; // simple placeholder signal; extend with real ward risk data

  const rawScore = severityScore + voteScore + categoryWeight + locationRisk;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function scoreToPriorityLevel(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

module.exports = { calculatePriorityScore, scoreToPriorityLevel };
