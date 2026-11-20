const Issue = require('../models/Issue');

// Generates sequential complaint IDs like CF-1001, CF-1002, ...
async function generateComplaintId() {
  const lastIssue = await Issue.findOne().sort({ createdAt: -1 }).select('issueId');

  if (!lastIssue || !lastIssue.issueId) {
    return 'CF-1001';
  }

  const lastNumber = parseInt(lastIssue.issueId.replace('CF-', ''), 10);
  const nextNumber = Number.isNaN(lastNumber) ? 1001 : lastNumber + 1;
  return `CF-${nextNumber}`;
}

module.exports = generateComplaintId;
