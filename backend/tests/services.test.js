const { classifyIssue } = require('../src/services/aiService');
const { calculatePriorityScore, scoreToPriorityLevel } = require('../src/services/priorityService');

describe('aiService (mock classification)', () => {
  test('detects pothole from keywords when no category is given', () => {
    const result = classifyIssue({
      title: 'Dangerous pothole on main road',
      description: 'A large pothole causing accidents',
    });
    expect(result.category).toBe('Pothole');
    expect(result.severity).toBeGreaterThanOrEqual(8);
    expect(result.recommendedDepartment).toBe('Road Maintenance');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('trusts an explicitly provided category with high confidence', () => {
    const result = classifyIssue({ title: 'x', description: 'y', category: 'Sewage' });
    expect(result.category).toBe('Sewage');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.recommendedDepartment).toBe('Sewage');
  });

  test('falls back to Other for unrecognized text', () => {
    const result = classifyIssue({ title: 'General complaint', description: 'Something is not right' });
    expect(result.category).toBe('Other');
  });
});

describe('priorityService (smart priority scoring)', () => {
  test('score stays within 0-100 bounds', () => {
    const score = calculatePriorityScore({ severity: 10, upvoteCount: 1000, category: 'Sewage', ward: 'Ward 5' });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('higher severity and more upvotes increase the score', () => {
    const low = calculatePriorityScore({ severity: 2, upvoteCount: 0, category: 'Garbage', ward: '' });
    const high = calculatePriorityScore({ severity: 9, upvoteCount: 50, category: 'Garbage', ward: '' });
    expect(high).toBeGreaterThan(low);
  });

  test('maps scores to the correct priority band', () => {
    expect(scoreToPriorityLevel(10)).toBe('LOW');
    expect(scoreToPriorityLevel(45)).toBe('MEDIUM');
    expect(scoreToPriorityLevel(70)).toBe('HIGH');
    expect(scoreToPriorityLevel(95)).toBe('CRITICAL');
  });
});
