const Notification = require('../models/Notification');

async function notify(userId, message, type = 'GENERAL', issueId = null) {
  return Notification.create({ user: userId, message, type, issue: issueId });
}

module.exports = { notify };
