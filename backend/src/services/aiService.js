/**
 * AI classification service — MOCK implementation.
 *
 * This module is intentionally isolated so it can be swapped for a real AI/ML
 * provider (vision model, custom classifier, etc.) later without touching any
 * controller code. It never requires an API key to function.
 *
 * To connect a real provider:
 *   1. Set AI_PROVIDER and AI_API_KEY in backend/.env
 *   2. Implement a new branch below that calls the real provider and returns
 *      the same { category, severity, confidence, recommendedDepartment } shape.
 */

const CATEGORY_KEYWORDS = {
  Pothole: ['pothole', 'crater', 'road hole', 'sunken'],
  'Road Damage': ['crack', 'broken road', 'damaged road', 'asphalt'],
  Garbage: ['garbage', 'trash', 'waste', 'litter', 'rubbish'],
  Drainage: ['drain', 'drainage', 'clogged', 'flooding', 'waterlogging'],
  'Water Supply': ['water supply', 'no water', 'pipeline leak', 'water leak'],
  Streetlight: ['streetlight', 'street light', 'lamp post', 'dark street'],
  Sewage: ['sewage', 'sewer', 'manhole', 'overflow'],
  'Public Toilet': ['toilet', 'restroom', 'urinal'],
  'Illegal Dumping': ['dumping', 'dumped', 'illegal waste'],
};

const CATEGORY_TO_DEPARTMENT = {
  Pothole: 'Road Maintenance',
  'Road Damage': 'Road Maintenance',
  Garbage: 'Waste Management',
  'Illegal Dumping': 'Waste Management',
  Drainage: 'Drainage',
  'Water Supply': 'Water Supply',
  Streetlight: 'Electrical',
  Sewage: 'Sewage',
  'Public Toilet': 'Waste Management',
  Other: 'Waste Management',
};

const SEVERITY_KEYWORDS = {
  high: ['dangerous', 'accident', 'urgent', 'severe', 'major', 'huge', 'collapsed', 'overflowing'],
  medium: ['moderate', 'growing', 'ongoing'],
};

/**
 * Runs mock classification based on the submitted title/description text.
 * Deterministic and free — no external calls, no API key required.
 */
function classifyIssue({ title = '', description = '', category = null }) {
  const text = `${title} ${description}`.toLowerCase();

  let detectedCategory = category;
  let bestScore = 0;

  if (!detectedCategory) {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const score = keywords.filter((kw) => text.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        detectedCategory = cat;
      }
    }
    if (!detectedCategory) detectedCategory = 'Other';
  }

  let severity = 5;
  if (SEVERITY_KEYWORDS.high.some((kw) => text.includes(kw))) severity = 9;
  else if (SEVERITY_KEYWORDS.medium.some((kw) => text.includes(kw))) severity = 6;

  // Confidence is higher when we matched real keywords, lower for a generic fallback.
  const confidence = category ? 0.99 : Math.min(0.6 + bestScore * 0.1, 0.95);

  const recommendedDepartment = CATEGORY_TO_DEPARTMENT[detectedCategory] || 'Waste Management';

  return {
    category: detectedCategory,
    severity,
    confidence: Number(confidence.toFixed(2)),
    recommendedDepartment,
  };
}

module.exports = { classifyIssue };
