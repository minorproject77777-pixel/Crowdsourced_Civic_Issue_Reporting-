/**
 * CivicFix seed script.
 *
 * Usage (from backend/):
 *   npm run seed          -> populates the database (keeps existing data)
 *   npm run seed:clear    -> wipes all CivicFix collections first, then populates
 *
 * Reads MONGODB_URI from backend/.env (via dotenv), same as the server.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const mongoose = require('mongoose');

const User = require('../../backend/src/models/User');
const Issue = require('../../backend/src/models/Issue');
const Department = require('../../backend/src/models/Department');
const Category = require('../../backend/src/models/Category');
const Comment = require('../../backend/src/models/Comment');
const Upvote = require('../../backend/src/models/Upvote');
const Notification = require('../../backend/src/models/Notification');
const StatusHistory = require('../../backend/src/models/StatusHistory');
const ResolutionFeedback = require('../../backend/src/models/ResolutionFeedback');

const { classifyIssue } = require('../../backend/src/services/aiService');
const { calculatePriorityScore, scoreToPriorityLevel } = require('../../backend/src/services/priorityService');

const shouldClear = process.argv.includes('--clear');

// ---------- Reference data ----------

const RAIPUR_CENTER = { lat: 21.2514, lng: 81.6296 };
const WARDS = [
  'Shankar Nagar',
  'Telibandha',
  'Pandri',
  'Devendra Nagar',
  'Amanaka',
  'Civil Lines',
  'Gudhiyari',
  'Tatibandh',
  'Mowa',
  'Kota',
];

const DEPARTMENTS = [
  { name: 'Waste Management', description: 'Handles garbage collection, illegal dumping and public sanitation.', headName: 'Suresh Patil', contactEmail: 'waste@civicfix.gov.in' },
  { name: 'Road Maintenance', description: 'Repairs potholes and damaged roads.', headName: 'Anita Deshmukh', contactEmail: 'roads@civicfix.gov.in' },
  { name: 'Water Supply', description: 'Manages municipal water supply and pipeline issues.', headName: 'Ramesh Yadav', contactEmail: 'water@civicfix.gov.in' },
  { name: 'Drainage', description: 'Maintains stormwater drains and prevents waterlogging.', headName: 'Kavita Joshi', contactEmail: 'drainage@civicfix.gov.in' },
  { name: 'Electrical', description: 'Maintains streetlights and public electrical infrastructure.', headName: 'Vikram Singh', contactEmail: 'electrical@civicfix.gov.in' },
  { name: 'Sewage', description: 'Manages sewer lines and manhole maintenance.', headName: 'Deepak Nair', contactEmail: 'sewage@civicfix.gov.in' },
];

const CATEGORIES = [
  { name: 'Garbage', icon: 'Trash2', department: 'Waste Management', categoryWeight: 12 },
  { name: 'Pothole', icon: 'AlertTriangle', department: 'Road Maintenance', categoryWeight: 20 },
  { name: 'Road Damage', icon: 'Construction', department: 'Road Maintenance', categoryWeight: 18 },
  { name: 'Drainage', icon: 'Waves', department: 'Drainage', categoryWeight: 18 },
  { name: 'Water Supply', icon: 'Droplet', department: 'Water Supply', categoryWeight: 16 },
  { name: 'Streetlight', icon: 'Lightbulb', department: 'Electrical', categoryWeight: 10 },
  { name: 'Sewage', icon: 'AlertOctagon', department: 'Sewage', categoryWeight: 22 },
  { name: 'Public Toilet', icon: 'DoorClosed', department: 'Waste Management', categoryWeight: 10 },
  { name: 'Illegal Dumping', icon: 'Ban', department: 'Waste Management', categoryWeight: 12 },
  { name: 'Other', icon: 'CircleHelp', department: 'Waste Management', categoryWeight: 8 },
];

const CITIZEN_NAMES = [
  'Ravi Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Rao', 'Vikas Gupta',
  'Neha Singh', 'Rajesh Patel', 'Anjali Mehta', 'Sanjay Yadav', 'Pooja Iyer',
  'Manoj Tiwari', 'Kavya Reddy', 'Deepak Chauhan', 'Swati Kulkarni', 'Arun Nair',
  'Meera Pillai', 'Rahul Malhotra', 'Divya Menon', 'Ashok Bansal', 'Shreya Agarwal',
  'Vijay Kumar', 'Nisha Thakur', 'Karan Chopra', 'Ritu Saxena', 'Gopal Mishra',
  'Aarti Desai', 'Sandeep Joshi', 'Lakshmi Narayan', 'Harish Bhatt', 'Preeti Sinha',
];

const STAFF_NAMES = [
  'Mohan Lal', 'Sarita Devi', 'Rakesh Kumar', 'Geeta Sharma', 'Naresh Chandra',
  'Kamla Prasad', 'Bhupendra Singh', 'Usha Rani', 'Dinesh Kumar', 'Radha Krishnan',
];

const ADMIN_NAMES = ['Municipal Admin', 'Ward Officer', 'City Commissioner'];

const ISSUE_TEMPLATES = [
  { category: 'Pothole', title: 'Large pothole causing traffic', description: 'A dangerous pothole has formed near the intersection, causing vehicles to swerve and risking accidents especially at night.' },
  { category: 'Garbage', title: 'Garbage not collected for a week', description: 'Household waste has piled up on the street corner and has not been collected by the municipal truck for over a week, attracting stray animals.' },
  { category: 'Streetlight', title: 'Streetlight not working', description: 'The streetlight on this stretch has been off for several nights, making the area unsafe for pedestrians after dark.' },
  { category: 'Drainage', title: 'Waterlogging after rain', description: 'The stormwater drain is clogged with debris, causing waterlogging on the road every time it rains, blocking the footpath.' },
  { category: 'Water Supply', title: 'No water supply for two days', description: 'Our locality has had no municipal water supply for two consecutive days without any prior notice.' },
  { category: 'Sewage', title: 'Manhole overflowing', description: 'A sewage manhole cover is broken and overflowing onto the main road, creating a health hazard and foul smell.' },
  { category: 'Road Damage', title: 'Road surface cracked and uneven', description: 'Large cracks have developed across the road surface after recent construction work, making it difficult for two-wheelers to pass safely.' },
  { category: 'Illegal Dumping', title: 'Construction debris dumped illegally', description: 'Someone has dumped a large pile of construction debris on the vacant plot, blocking part of the road and looking unsightly.' },
  { category: 'Public Toilet', title: 'Public toilet in unusable condition', description: 'The public toilet near the market has no running water and has not been cleaned in a long time.' },
  { category: 'Garbage', title: 'Overflowing community dustbin', description: 'The community dustbin near the park is overflowing and garbage is scattered around the area by stray dogs.' },
];

const STATUS_FLOW = ['REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'];

// ---------- Helpers ----------

function randomOffset() {
  // ~ +/- 4km around Raipur center
  return (Math.random() - 0.5) * 0.07;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeightedStatus(index, total) {
  // Skew earlier issues toward resolved, later ones toward in-progress/reported, for a realistic distribution
  const ratio = index / total;
  if (ratio < 0.35) return 'RESOLVED';
  if (ratio < 0.5) return 'IN_PROGRESS';
  if (ratio < 0.62) return 'ASSIGNED';
  if (ratio < 0.72) return 'VERIFIED';
  if (ratio < 0.85) return 'REPORTED';
  if (ratio < 0.92) return 'REJECTED';
  return 'REOPENED';
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env first.');
    process.exit(1);
  }

  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);
  console.log('Connected.');

  if (shouldClear) {
    console.log('Clearing existing CivicFix collections...');
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
      Department.deleteMany({}),
      Category.deleteMany({}),
      Comment.deleteMany({}),
      Upvote.deleteMany({}),
      Notification.deleteMany({}),
      StatusHistory.deleteMany({}),
      ResolutionFeedback.deleteMany({}),
    ]);
  }

  // ---- Departments ----
  console.log('Seeding departments...');
  const departmentDocs = {};
  for (const dept of DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate({ name: dept.name }, dept, { upsert: true, new: true });
    departmentDocs[dept.name] = doc;
  }

  // ---- Categories ----
  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      {
        name: cat.name,
        icon: cat.icon,
        categoryWeight: cat.categoryWeight,
        defaultDepartment: departmentDocs[cat.department]._id,
      },
      { upsert: true, new: true }
    );
  }

  // ---- Users ----
  console.log('Seeding users...');

  const adminAccounts = [
    { name: 'Municipal Admin', email: 'admin@civicfix.com', password: 'Admin@123' },
    ...ADMIN_NAMES.slice(1).map((name, i) => ({
      name,
      email: `admin${i + 2}@civicfix.com`,
      password: 'Admin@123',
    })),
  ];

  const admins = [];
  for (const acc of adminAccounts) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create({ ...acc, role: 'admin', phone: randomPhone() });
    }
    admins.push(user);
  }

  const staffAccounts = [
    { name: 'Staff Member', email: 'staff@civicfix.com', password: 'Staff@123', department: departmentDocs['Road Maintenance']._id },
    ...STAFF_NAMES.map((name, i) => ({
      name,
      email: `staff${i + 2}@civicfix.com`,
      password: 'Staff@123',
      department: departmentDocs[DEPARTMENTS[i % DEPARTMENTS.length].name]._id,
    })),
  ];

  const staff = [];
  for (const acc of staffAccounts) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create({ ...acc, role: 'staff', phone: randomPhone() });
    }
    staff.push(user);
  }

  const citizenAccounts = [
    { name: 'Demo Citizen', email: 'citizen@civicfix.com', password: 'Citizen@123' },
    ...CITIZEN_NAMES.map((name, i) => ({
      name,
      email: `citizen${i + 2}@civicfix.com`,
      password: 'Citizen@123',
    })),
  ];

  const citizens = [];
  for (const acc of citizenAccounts) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create({ ...acc, role: 'citizen', phone: randomPhone(), ward: pick(WARDS) });
    }
    citizens.push(user);
  }

  function randomPhone() {
    return `9${Math.floor(100000000 + Math.random() * 899999999)}`.slice(0, 10);
  }

  console.log(`Users ready: ${admins.length} admins, ${staff.length} staff, ${citizens.length} citizens.`);

  // ---- Issues ----
  const existingIssueCount = await Issue.countDocuments();
  if (existingIssueCount >= 50 && !shouldClear) {
    console.log(`Database already has ${existingIssueCount} issues — skipping issue generation. Use "npm run seed:clear" to regenerate.`);
  } else {
    console.log('Seeding issues (50+)...');
    const TOTAL_ISSUES = 55;
    let lastNumber = 1000;

    for (let i = 0; i < TOTAL_ISSUES; i += 1) {
      const template = pick(ISSUE_TEMPLATES);
      const reporter = pick(citizens);
      const ward = pick(WARDS);
      const lat = RAIPUR_CENTER.lat + randomOffset();
      const lng = RAIPUR_CENTER.lng + randomOffset();

      const aiClassification = classifyIssue({
        title: template.title,
        description: template.description,
        category: template.category,
      });
      const upvoteCount = Math.floor(Math.random() * 60);
      const severity = aiClassification.severity;
      const priorityScore = calculatePriorityScore({ severity, upvoteCount, category: template.category, ward });
      const priority = scoreToPriorityLevel(priorityScore);

      const status = pickWeightedStatus(i, TOTAL_ISSUES);
      const createdAt = daysAgo(Math.floor(Math.random() * 120) + 1);

      lastNumber += 1;
      const issueId = `CF-${lastNumber}`;

      const departmentName = CATEGORIES.find((c) => c.name === template.category)?.department;
      const department = ['REPORTED', 'UNDER_REVIEW'].includes(status) ? null : departmentDocs[departmentName]._id;

      const deptStaff = staff.filter((s) => String(s.department) === String(department));
      const assignedTo =
        ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'].includes(status) && deptStaff.length
          ? pick(deptStaff)._id
          : null;

      const resolvedAt = ['RESOLVED'].includes(status) ? daysAgo(Math.floor(Math.random() * 20)) : null;

      const issue = await Issue.create({
        issueId,
        title: template.title,
        description: template.description,
        category: template.category,
        reportedBy: reporter._id,
        department,
        assignedTo,
        location: { type: 'Point', coordinates: [lng, lat] },
        address: `${Math.floor(Math.random() * 200) + 1}, ${ward}, Raipur, Chhattisgarh`,
        ward,
        priority,
        priorityScore,
        severity,
        status,
        images: [],
        upvoteCount: 0, // will increment via real Upvote docs below for consistency
        aiClassification,
        resolvedAt,
        citizenVerifiedAt: status === 'RESOLVED' && Math.random() > 0.5 ? resolvedAt : null,
        citizenRating: status === 'RESOLVED' && Math.random() > 0.5 ? Math.ceil(Math.random() * 5) : null,
        rejectionReason: status === 'REJECTED' ? 'Duplicate of an existing verified complaint.' : null,
        reopenReason: status === 'REOPENED' ? 'Citizen reported the issue was not actually fixed.' : null,
        reopenCount: status === 'REOPENED' ? 1 : 0,
        createdAt,
        updatedAt: createdAt,
      });

      // Status history trail
      const historyChain = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) >= 0 ? STATUS_FLOW.indexOf(status) + 1 : 1);
      let prev = null;
      for (const s of ['REPORTED']) {
        await StatusHistory.create({ issue: issue._id, fromStatus: prev, toStatus: s, changedBy: reporter._id, note: 'Issue reported by citizen', createdAt });
        prev = s;
      }
      if (status !== 'REPORTED') {
        await StatusHistory.create({
          issue: issue._id,
          fromStatus: 'REPORTED',
          toStatus: status,
          changedBy: pick(admins)._id,
          note: `Status updated to ${status}`,
          createdAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 6),
        });
      }

      // Upvotes from random distinct citizens
      const upvoters = shuffle(citizens.filter((c) => String(c._id) !== String(reporter._id))).slice(0, Math.min(upvoteCount, citizens.length - 1));
      for (const voter of upvoters) {
        try {
          await Upvote.create({ issue: issue._id, user: voter._id });
        } catch (e) {
          /* ignore duplicate */
        }
      }
      issue.upvoteCount = upvoters.length;
      await issue.save();

      // Comments (0-3 per issue)
      const commentCount = Math.floor(Math.random() * 4);
      const commenters = shuffle(citizens).slice(0, commentCount);
      const sampleComments = [
        'This has been an issue for a while, please resolve soon.',
        'Same problem in our lane too, hope it gets fixed.',
        'Thank you for reporting this, I have faced the same issue.',
        'Any update on when this will be fixed?',
      ];
      for (const commenter of commenters) {
        await Comment.create({ issue: issue._id, author: commenter._id, text: pick(sampleComments) });
      }
      issue.commentCount = commenters.length;
      await issue.save();

      // Resolution feedback for resolved issues that were citizen-verified
      if (issue.citizenVerifiedAt) {
        await ResolutionFeedback.create({
          issue: issue._id,
          citizen: reporter._id,
          confirmed: true,
          rating: issue.citizenRating || 4,
          comment: 'Issue was fixed properly, thank you.',
        });
      }

      // Notifications for the reporter reflecting the current status
      const notifMessages = {
        VERIFIED: `Your complaint ${issue.issueId} has been verified.`,
        ASSIGNED: `Your complaint ${issue.issueId} has been assigned to a department.`,
        IN_PROGRESS: `Work has started on your complaint ${issue.issueId}.`,
        RESOLVED: `Your complaint ${issue.issueId} has been marked as resolved. Please verify the resolution.`,
        REOPENED: `Your complaint ${issue.issueId} has been reopened.`,
        REJECTED: `Your complaint ${issue.issueId} was rejected.`,
      };
      if (notifMessages[status]) {
        await Notification.create({
          user: reporter._id,
          issue: issue._id,
          message: notifMessages[status],
          type: status === 'RESOLVED' ? 'VERIFY_RESOLUTION' : 'ISSUE_VERIFIED',
          isRead: Math.random() > 0.5,
        });
      }

      // Civic points for reporter
      reporter.civicPoints += 10 + upvoters.length * 0 + (issue.citizenVerifiedAt ? 5 : 0);
      await reporter.save();

      if ((i + 1) % 10 === 0) console.log(`  ...${i + 1}/${TOTAL_ISSUES} issues created`);
    }
  }

  // Civic points for upvoting citizens (approximate bulk update)
  console.log('Finalizing civic points from upvotes...');
  const upvoteCounts = await Upvote.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]);
  for (const uc of upvoteCounts) {
    await User.findByIdAndUpdate(uc._id, { $inc: { civicPoints: uc.count * 2 } });
  }

  console.log('\n✅ Seed complete.\n');
  console.log('Demo accounts:');
  console.log('  Admin:   admin@civicfix.com    / Admin@123');
  console.log('  Staff:   staff@civicfix.com     / Staff@123');
  console.log('  Citizen: citizen@civicfix.com   / Citizen@123\n');

  await mongoose.disconnect();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
