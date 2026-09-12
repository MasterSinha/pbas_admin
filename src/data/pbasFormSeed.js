// Seed data consumed by src/utils/dynamicFormRegistry.js, which converts it into
// two pre-loaded forms in the Dynamic Form builder (src/pages/forms/DynamicFormPage.jsx).
//
// Mirrors the REAL, currently hand-coded section/field structure of the faculty
// appraisal form — extracted from the faculty-appraisal-frontend repo's
// src/features/faculty-appraisal/forms/standard/StandardMyAppraisal.jsx and
// .../CreativeSchool/CreativeSchoolAppraisalForm.jsx — so the builder opens
// showing the actual PBAS form instead of a blank slate. `storageTable` is a
// best-effort match against that system's schema.sql; several sections have no
// obvious physical table and are left `null` ("unknown — confirm with backend").
//
// Field `type` uses the closed enum: text | number | date | select | yesNo |
// conditionalText | computed | file | checkbox.

function field(key, label, type, extra = {}) {
  return {
    key,
    label,
    type,
    required: false,
    options: [],
    rowMax: null,
    isCustom: false,
    active: true,
    ...extra,
  };
}

function section({ family, part, key, title, max, storageTable, repeatable, fields }) {
  return {
    code: `${family}__${key}`,
    formFamily: family,
    part,
    sectionKey: key,
    title,
    maxMarks: max,
    storageTable: storageTable || null,
    repeatable: Boolean(repeatable),
    active: true,
    fieldSchema: fields,
  };
}

// ── STANDARD ──────────────────────────────────────────────────────────────
const STANDARD_SECTIONS = [
  section({
    family: 'standard', part: 'A', key: 'lectures', title: 'A1. Lectures / Tutorials / Practicals',
    max: 40, storageTable: 'teaching_process', repeatable: true,
    fields: [
      field('sem', 'Semester', 'text', { required: true }),
      field('code', 'Course Code / Name', 'text', { required: true }),
      field('planned', 'Classes as per Course Structure', 'number'),
      field('conducted', 'Classes Actually Conducted', 'number'),
      field('score', 'Self Score', 'computed', { rowMax: 10 }),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'courseFile', title: 'A2. Course File',
    max: 20, storageTable: 'course_files', repeatable: true,
    fields: [
      field('course', 'Course', 'text', { required: true }),
      field('title', 'Title / Detail', 'text'),
      field('details', 'Compliance', 'yesNo'),
      field('score', 'Score', 'number', { rowMax: 20 }),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'innovRows', title: 'A3. Innovative Teaching-Learning Methods',
    max: 20, storageTable: 'innovative_teaching', repeatable: true,
    fields: [
      field('method', 'Method', 'conditionalText', {
        options: ['Blended Learning', 'Virtual Lab', 'LMS', 'Project Based Learning', 'Flip Classroom', 'Any Other'],
        triggerValue: 'Any Other', extraKey: 'methodOther', extraLabel: 'Please specify',
      }),
      field('details', 'Details', 'text'),
      field('score', 'Score', 'computed', { rowMax: 2 }),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'feedback', title: 'A4. Student Feedback',
    max: 10, storageTable: 'student_feedback', repeatable: true,
    fields: [
      field('code', 'Course Code', 'text', { required: true }),
      field('fb1', 'Feedback 1 (%)', 'number'),
      field('fb2', 'Feedback 2 (%)', 'number'),
      field('score', 'Score', 'computed', { rowMax: 10 }),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'obeRows', title: 'A5. Learning Outcomes Attainment & OBE Practice',
    max: 20, storageTable: null, repeatable: false,
    fields: [
      field('component', 'Component', 'text', { active: true }),
      field('evidence', 'Evidence', 'file'),
      field('score', 'Score', 'number'),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'projects', title: 'A6. Guided Students Project',
    max: 20, storageTable: 'projects_guided', repeatable: true,
    fields: [
      field('label', 'Category', 'select', { options: ['Project Batch', 'Award', 'Sponsorship', 'Outcome'] }),
      field('score', 'Score', 'number', { rowMax: 5 }),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'mentoringRows', title: 'A7. Student Mentoring & Counselling',
    max: 10, storageTable: null, repeatable: false,
    fields: [
      field('activity', 'Activity', 'text'),
      field('evidence', 'Evidence', 'file'),
      field('score', 'Score', 'number'),
    ],
  }),
  section({
    family: 'standard', part: 'A', key: 'quals', title: 'A8. Professional Development & Qualification Enhancement',
    max: 10, storageTable: 'qualification_enhancement', repeatable: true,
    fields: [
      field('label', 'Detail', 'text', { required: true }),
      field('score', 'Score', 'number', { rowMax: 10 }),
    ],
  }),

  section({
    family: 'standard', part: 'B', key: 'journals', title: 'B1. Journal Publications',
    max: 100, storageTable: 'journal_publications', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('journal', 'Journal', 'text'),
      field('issn', 'DOI / ISSN No.', 'text'),
      field('impactFactor', 'Impact Factor', 'text'),
      field('authorPosition', 'Author Position / Co-Authors', 'text'),
      field('score', 'Score', 'number'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'books', title: 'B2. Books, Book Chapters & Edited Volumes',
    max: 30, storageTable: 'book_publications', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('book', 'Publisher & ISBN', 'text'),
      field('pub', 'Type', 'select', { options: ['Book', 'Book Chapter', 'Edited Volume'] }),
      field('level', 'Level', 'select', { options: ['National', 'International'] }),
      field('coauth', 'Co-Authors', 'text'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'patents', title: 'B3. Patents, Copyrights & IP and Product Development',
    max: 40, storageTable: 'patents', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('type', 'Type', 'select', { options: ['National', 'International'] }),
      field('status', 'Status', 'select', { options: ['Filed', 'Published', 'Granted'] }),
      field('fileNo', 'File No.', 'text'),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'projects2', title: 'B4. External Funded Research Projects',
    max: 40, storageTable: 'external_research_projects', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('agency', 'Funding Agency', 'text'),
      field('date', 'Date', 'date'),
      field('amount', 'Amount', 'number'),
      field('role', 'Role', 'select', { options: ['PI', 'Co-PI'] }),
      field('status', 'Status', 'select', { options: ['Completed', 'Ongoing', 'Sanctioned', 'Submitted'] }),
      field('score', 'Score', 'computed'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'research', title: 'B5. Research Guidance',
    max: 20, storageTable: 'research_guidance', repeatable: true,
    fields: [
      field('degree', 'Degree', 'select', { options: ['PG', 'PhD'] }),
      field('name', 'Scholar Name', 'text'),
      field('thesis', 'Thesis Title', 'text'),
      field('status', 'Status', 'select', { options: ['Ongoing', 'Awarded'] }),
      field('date', 'Date', 'date'),
      field('score', 'Score', 'computed', { rowMax: 20 }),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'proposals', title: 'B6. Consultancy, Testing & Training',
    max: 20, storageTable: 'research_proposals', repeatable: true,
    fields: [
      field('agency', 'Client / Agency', 'text', { required: true }),
      field('duration', 'Nature / Duration', 'text'),
      field('amount', 'Amount', 'number'),
      field('score', 'Score', 'computed'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'confs', title: 'B7. Conference/FDP/Training/Workshop — Resource Person',
    max: 20, storageTable: 'conferences', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('type', 'Type', 'select', { options: ['Conference', 'FDP', 'Training', 'Workshop'] }),
      field('org', 'Organizer', 'text'),
      field('level', 'Level', 'select', { options: ['National', 'International'] }),
      field('role', 'Role', 'text'),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'fdps', title: 'B8. Conference/FDP/Industry Training — Attended',
    max: 20, storageTable: 'self_development', repeatable: true,
    fields: [
      field('program', 'Program', 'text', { required: true }),
      field('fromDate', 'From Date', 'date'),
      field('toDate', 'To Date', 'date'),
      field('org', 'Organizer', 'text'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'training', title: 'B8b. Industrial Training',
    max: 20, storageTable: 'industrial_training', repeatable: true,
    fields: [
      field('company', 'Company', 'text', { required: true }),
      field('duration', 'Duration', 'text'),
      field('nature', 'Nature', 'text'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'awards', title: 'B9. Research Awards, Fellowships, Reviewer & Citations',
    max: 20, storageTable: 'awards', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('agency', 'Agency', 'text'),
      field('level', 'Level', 'select', { options: ['National', 'International'] }),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'products', title: 'B10. Innovation, Start-ups & Technology Transfer',
    max: 20, storageTable: 'products_developed', repeatable: true,
    fields: [
      field('details', 'Details', 'text', { required: true }),
      field('role', 'Role', 'text'),
      field('status', 'Status', 'select', { options: ['Ongoing', 'Completed'] }),
    ],
  }),
  section({
    family: 'standard', part: 'B', key: 'ict', title: 'B11. ICT Content, MOOCs & E-Learning',
    max: 20, storageTable: 'ict_pedagogy', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('type', 'Type', 'select', { options: ['MOOC', 'E-Content', 'Video Lecture'] }),
      field('quad', 'Reach / Views', 'text'),
    ],
  }),

  section({
    family: 'standard', part: 'C', key: 'uniActs', title: 'C1. Administration at University Level',
    max: 50, storageTable: 'university_activities', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('nature', 'Nature', 'select', { options: ['Committee', 'Coordinator', 'Convener'] }), field('period', 'Period', 'text')],
  }),
  section({
    family: 'standard', part: 'C', key: 'deptActs', title: 'C2. Administration at School Level',
    max: 30, storageTable: 'department_activities', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('nature', 'Nature', 'select', { options: ['Committee', 'Coordinator', 'Convener'] }), field('period', 'Period', 'text')],
  }),
  section({
    family: 'standard', part: 'C', key: 'eventRows', title: 'C3. Event Organisation & Institutional Visibility',
    max: 20, storageTable: null, repeatable: true,
    fields: [field('event', 'Event', 'text', { required: true }), field('role', 'Role', 'text'), field('fromDate', 'From Date', 'date'), field('toDate', 'To Date', 'date'), field('level', 'Level', 'select', { options: ['Institute', 'National', 'International'] })],
  }),
  section({
    family: 'standard', part: 'C', key: 'society', title: 'C4. Outreach, Extension & Social Responsibility',
    max: 10, storageTable: 'social_contributions', repeatable: true,
    fields: [
      field('label', 'Activity', 'select', { options: ['Induction Program', 'Unnat Bharat Abhiyan', 'Yoga Classes', 'Blood Donation', 'Techno Social activities', 'NSS', 'Social visits', 'Project of Social Impact', 'Any other'] }),
      field('details', 'Details', 'text'),
      field('date', 'Date', 'date'),
      field('score', 'Score', 'number', { rowMax: 5 }),
    ],
  }),
  section({
    family: 'standard', part: 'C', key: 'industry', title: 'C5. Industry Interaction & Linkages',
    max: 10, storageTable: 'industry_connect', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('partner', 'Partner', 'text'), field('date', 'Date', 'date')],
  }),
  section({
    family: 'standard', part: 'C', key: 'alumniRows', title: 'C6. Alumni Engagement & Networking',
    max: 10, storageTable: null, repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('details', 'Details', 'text'), field('date', 'Date', 'date')],
  }),
  section({
    family: 'standard', part: 'C', key: 'placementRows', title: 'C7. Student Placement Mentoring & Career Development',
    max: 20, storageTable: null, repeatable: true,
    fields: [field('activityType', 'Type', 'select', { options: ['Mentoring', 'Career Talk', 'Drive Coordination'] }), field('name', 'Name / Detail', 'text'), field('date', 'Date', 'date')],
  }),

  section({
    family: 'standard', part: 'D', key: 'leaveManagement', title: 'Leave & Attendance Management',
    max: 25, storageTable: null, repeatable: false,
    fields: [
      field('clTaken', 'CL Taken', 'number'), field('clOutOf', 'CL Out Of', 'number'),
      field('mlTaken', 'ML Taken', 'number'), field('mlOutOf', 'ML Out Of', 'number'),
      field('odTaken', 'OD Taken', 'number'), field('odOutOf', 'OD Out Of', 'number'),
      field('coffTaken', 'C-Off Taken', 'number'), field('coffOutOf', 'C-Off Out Of', 'number'),
      field('lateRemarks', 'Late Remarks', 'number'),
      field('workingDays', 'Working Days', 'number'),
      field('managementRating', 'Management Rating', 'select', {
        options: ['Unacceptable (0-5)', 'Below Average (6-10)', 'Average (11-15)', 'Above Average (16-20)', 'Outstanding (Above 20)'],
      }),
      field('score', 'Score', 'computed', { rowMax: 25 }),
    ],
  }),

  section({
    family: 'standard', part: 'E', key: 'acr', title: 'Annual Confidential Report (ACR)',
    max: 50, storageTable: 'acr_scores', repeatable: false,
    fields: [
      field('label', 'Parameter', 'text', { active: true }),
      field('score', 'Evaluator Score', 'number', { rowMax: 10 }),
    ],
  }),
];

// ── CREATIVE SCHOOL ──────────────────────────────────────────────────────
const CREATIVE_SECTIONS = [
  ...STANDARD_SECTIONS.filter(s => s.part === 'A').map(s => ({ ...s, code: s.code.replace('standard__', 'creative__'), formFamily: 'creative' })),

  section({
    family: 'creative', part: 'B', key: 'journals', title: 'B1. Journal Publications / Academic Research Papers',
    max: 60, storageTable: 'journal_publications', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('journal', 'Journal', 'text'),
      field('doi', 'DOI', 'text'),
      field('index', 'Index', 'select', { options: ['Q1', 'Q2', 'Q3', 'Q4'] }),
      field('impact', 'Impact Factor', 'text'),
      field('coAuthors', 'Co-Authors', 'text'),
      field('firstAuthor', 'First Author?', 'yesNo'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'books', title: 'B2. Books, Book Chapters & Edited Volumes',
    max: 30, storageTable: 'book_publications', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('publisher', 'Publisher & ISBN', 'text'),
      field('type', 'Type', 'select', { options: ['Book', 'Book Chapter', 'Edited Volume'] }),
      field('level', 'Level', 'select', { options: ['National', 'International'] }),
      field('coAuthors', 'Co-Authors', 'text'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'popularWritings', title: 'B3(1). Popular Writing — Newspaper/Magazine Articles',
    max: 40, storageTable: 'popular_writings', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('pubName', 'Publication', 'text'),
      field('type', 'Type', 'select', { options: ['Article', 'Column', 'Review', 'Op-ed'] }),
      field('circulation', 'Circulation', 'select', { options: ['Local', 'Regional', 'National', 'International'] }),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'ipr', title: 'B3(2). Patents, Copyrights, IP & Creative Product Development',
    max: 40, storageTable: 'ipr_records', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('scope', 'Scope', 'select', { options: ['National', 'International'] }),
      field('status', 'Status', 'select', { options: ['Filed', 'Published', 'Granted'] }),
      field('fileNo', 'File No.', 'text'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'externalProjects', title: 'B4. Funded Research/Creative Projects & Grants',
    max: 20, storageTable: 'external_research_projects', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('agency', 'Agency', 'text'),
      field('date', 'Date', 'date'),
      field('amount', 'Amount', 'number'),
      field('role', 'Role', 'select', { options: ['PI', 'Co-PI'] }),
      field('status', 'Status', 'select', { options: ['Completed', 'Ongoing', 'Sanctioned', 'Submitted'] }),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'research', title: 'B5. Research / Creative Guidance',
    max: 20, storageTable: 'research_guidance', repeatable: true,
    fields: [
      field('degree', 'Degree', 'select', { options: ['PG', 'PhD'] }),
      field('name', 'Scholar Name', 'text'),
      field('status', 'Status', 'select', { options: ['Ongoing', 'Awarded'] }),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'consultancy', title: 'B6. Consultancy, Training & Creative Commissions',
    max: 30, storageTable: 'research_proposals', repeatable: true,
    fields: [
      field('client', 'Client', 'text', { required: true }),
      field('nature', 'Nature', 'text'),
      field('amount', 'Amount', 'number'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'confs', title: 'B7. Conference/FDP/Training/Workshop — Resource Person',
    max: 20, storageTable: 'conferences', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('role', 'Role', 'text'),
      field('date', 'Date', 'date'),
      field('level', 'Level', 'select', { options: ['International', 'National'] }),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'fdps', title: 'B8. Conference/FDP/Industry-Studio Training Attended',
    max: 20, storageTable: 'self_development', repeatable: true,
    fields: [
      field('program', 'Program', 'text', { required: true }),
      field('fromDate', 'From Date', 'date'),
      field('toDate', 'To Date', 'date'),
      field('org', 'Organizer', 'text'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'awards', title: 'B9. Research Awards, Fellowships, Reviewer & Citations',
    max: 20, storageTable: 'awards', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('agency', 'Agency', 'text'),
      field('level', 'Level', 'select', { options: ['National', 'International'] }),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'innovation', title: 'B10. Innovation, Start-ups & Technology Transfer',
    max: 20, storageTable: 'products_developed', repeatable: true,
    fields: [
      field('title', 'Details', 'text', { required: true }),
      field('role', 'Role', 'text'),
      field('status', 'Status', 'select', { options: ['Ongoing', 'Completed'] }),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'ict', title: 'B11. ICT Content, MOOCs & E-Learning',
    max: 40, storageTable: 'ict_pedagogy', repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('platform', 'Platform', 'text'),
      field('reach', 'Reach', 'text'),
    ],
  }),
  section({
    family: 'creative', part: 'B', key: 'exhibitions', title: 'B12. Exhibitions — Photography, Design & Applied Arts, Documentaries, Films & AV Productions',
    max: 30, storageTable: null, repeatable: true,
    fields: [
      field('title', 'Title', 'text', { required: true }),
      field('type', 'Type', 'select', { options: ['Solo', 'Group', 'Curated'] }),
      field('venueLevel', 'Venue Level', 'select', { options: ['Institutional', 'National', 'International'] }),
      field('date', 'Date', 'date'),
    ],
  }),

  section({
    family: 'creative', part: 'C', key: 'uniActs', title: 'C1. Administration at University Level',
    max: 50, storageTable: 'university_activities', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('durationCat', 'Duration', 'select', { options: ['Short-term', 'Long-term'] }), field('period', 'Period', 'text')],
  }),
  section({
    family: 'creative', part: 'C', key: 'deptActs', title: 'C2. Administration at School Level',
    max: 30, storageTable: 'department_activities', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('durationCat', 'Duration', 'select', { options: ['Short-term', 'Long-term'] }), field('period', 'Period', 'text')],
  }),
  section({
    family: 'creative', part: 'C', key: 'events', title: 'C3. Event Organisation & Institutional Visibility',
    max: 20, storageTable: null, repeatable: true,
    fields: [field('event', 'Event', 'text', { required: true }), field('role', 'Role', 'text'), field('fromDate', 'From Date', 'date'), field('toDate', 'To Date', 'date'), field('level', 'Level', 'select', { options: ['Institute', 'National', 'International'] })],
  }),
  section({
    family: 'creative', part: 'C', key: 'society', title: 'C4. Mentoring Student Clubs, Outreach, Extension & Social Responsibility',
    max: 10, storageTable: 'social_contributions', repeatable: true,
    fields: [
      field('activity', 'Activity', 'select', { options: ['Induction Program', 'Unnat Bharat Abhiyan', 'Yoga Classes', 'Blood Donation', 'Techno Social activities', 'NSS', 'Social visits', 'Project of Social Impact', 'Any other'] }),
      field('details', 'Details', 'text'),
      field('date', 'Date', 'date'),
    ],
  }),
  section({
    family: 'creative', part: 'C', key: 'industry', title: 'C5. Industry Interaction & Linkages',
    max: 10, storageTable: 'industry_connect', repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('partner', 'Partner', 'text'), field('date', 'Date', 'date')],
  }),
  section({
    family: 'creative', part: 'C', key: 'alumni', title: 'C6. Alumni Engagement & Networking',
    max: 10, storageTable: null, repeatable: true,
    fields: [field('activity', 'Activity', 'text', { required: true }), field('details', 'Details', 'text'), field('date', 'Date', 'date')],
  }),
  section({
    family: 'creative', part: 'C', key: 'placements', title: 'C7. Student Placement Mentoring & Career Development',
    max: 20, storageTable: null, repeatable: true,
    fields: [field('type', 'Type', 'select', { options: ['Mentoring', 'Career Talk', 'Drive Coordination'] }), field('name', 'Name / Detail', 'text'), field('date', 'Date', 'date')],
  }),

  { ...STANDARD_SECTIONS.find(s => s.sectionKey === 'leaveManagement'), code: 'creative__leaveManagement', formFamily: 'creative' },
  { ...STANDARD_SECTIONS.find(s => s.sectionKey === 'acr'), code: 'creative__acr', formFamily: 'creative' },
];

export const FORM_FAMILIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'creative', label: 'Creative School' },
];

export const PARTS = ['A', 'B', 'C', 'D', 'E'];

export const PBAS_FORM_SEED = [...STANDARD_SECTIONS, ...CREATIVE_SECTIONS];
