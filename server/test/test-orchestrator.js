import { initDatabase, db } from '../src/db/database.js';
import { managerAgent } from '../src/agents/managerAgent.js';
import { reviewAgent } from '../src/agents/reviewAgent.js';
import { plannerAgent } from '../src/agents/plannerAgent.js';
import { assignmentAgent } from '../src/agents/assignmentAgent.js';
import { examAgent } from '../src/agents/examAgent.js';
import { tutorAgent } from '../src/agents/tutorAgent.js';

console.log('=====================================================');
console.log('  STUDYPILOT AI - COMPREHENSIVE MULTI-AGENT TEST SUITE');
console.log('=====================================================\n');

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // Test 1: Database Initialization
  console.log('--- TEST 1: SQLite Database & Schema ---');
  initDatabase();
  const subjects = db.prepare('SELECT * FROM subjects').all();
  assert(subjects.length >= 4, `Subjects seeded successfully (count: ${subjects.length})`);
  
  const assignments = db.prepare('SELECT * FROM assignments').all();
  assert(assignments.length >= 3, `Assignments seeded successfully (count: ${assignments.length})`);

  const exams = db.prepare('SELECT * FROM exams').all();
  assert(exams.length >= 2, `Exams seeded successfully (count: ${exams.length})`);

  // Test 2: AI Tutor Agent
  console.log('\n--- TEST 2: AI Tutor Agent ---');
  const tutorRes = await tutorAgent.execute('Explain eigenvalues and eigenvectors');
  assert(tutorRes.output && tutorRes.output.includes('Eigenvalues'), 'Tutor Agent generates concept explanation');
  assert(tutorRes.flashcards.length > 0, `Tutor Agent extracted flashcards (count: ${tutorRes.flashcards.length})`);
  assert(tutorRes.practiceQuestion !== null, 'Tutor Agent provided practice question');

  // Test 3: Study Planner Agent
  console.log('\n--- TEST 3: Study Planner Agent ---');
  const planRes = await plannerAgent.generateSchedule({
    daysCount: 1,
    dailyStudyHours: 3,
    startHour: 9,
    preferredBlockMinutes: 45,
    breakMinutes: 10
  });
  assert(planRes.slots && planRes.slots.length > 0, `Planner allocated slots (count: ${planRes.slots.length})`);
  const hasBreaks = planRes.slots.some(s => s.type === 'break');
  assert(hasBreaks, 'Planner includes cognitive rest breaks between study blocks');

  // Test 4: Review Agent Collision & Arithmetic Check
  console.log('\n--- TEST 4: Review Agent Verification ---');
  // 4a. Arithmetic Check
  const mathAuditPass = reviewAgent.verifyArithmetic({ text: '12 + 15 = 27 and 8 * 4 = 32' });
  assert(mathAuditPass.passed, 'Review Agent passes valid arithmetic');

  const mathAuditFail = reviewAgent.verifyArithmetic({ text: '12 + 15 = 39' });
  assert(!mathAuditFail.passed, 'Review Agent flags incorrect arithmetic');

  // 4b. Schedule Conflict Check
  const validSchedule = [
    { start_time: '09:00', end_time: '09:50', type: 'study', topic: 'Calculus' },
    { start_time: '09:50', end_time: '10:00', type: 'break', topic: 'Break' },
    { start_time: '10:00', end_time: '10:50', type: 'study', topic: 'Physics' }
  ];
  const schedPass = reviewAgent.verifyScheduleConflicts(validSchedule);
  assert(schedPass.passed, 'Review Agent approves collision-free schedule');

  const collidingSchedule = [
    { start_time: '09:00', end_time: '10:30', type: 'study', topic: 'Calculus' },
    { start_time: '10:00', end_time: '11:00', type: 'study', topic: 'Collision Slot' }
  ];
  const schedFail = reviewAgent.verifyScheduleConflicts(collidingSchedule);
  assert(!schedFail.passed && schedFail.issues.length > 0, 'Review Agent flags overlapping schedule collision');

  // Test 5: Assignment Agent Priority & Breakdown
  console.log('\n--- TEST 5: Assignment Agent ---');
  const now = new Date();
  const nearDue = new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0];
  const farDue = new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0];
  
  const urgentPri = assignmentAgent.calculatePriority(nearDue);
  const lowPri = assignmentAgent.calculatePriority(farDue);
  assert(urgentPri === 'urgent', `Calculates urgent priority for near deadline (${urgentPri})`);
  assert(lowPri === 'low', `Calculates low priority for distant deadline (${lowPri})`);

  const breakdownRes = await assignmentAgent.breakdownAssignment({
    title: 'Computer Science Lab: Binary Search Tree',
    description: 'Implement AVL rotation balance factors'
  });
  assert(breakdownRes.subtasks.length >= 3, `Assignment broken down into ${breakdownRes.subtasks.length} milestones`);

  // Test 6: Exam Agent Mock Test & Deterministic Scoring
  console.log('\n--- TEST 6: Exam Agent Scoring & Diagnostics ---');
  const mockTest = await examAgent.generateMockTest({
    subjectName: 'Computer Science',
    topic: 'Sorting & Graphs',
    count: 3
  });
  assert(mockTest.questions.length === 3, `Exam Agent created ${mockTest.questions.length} mock questions`);

  // Submit test: 2 right, 1 wrong
  const q1 = mockTest.questions[0];
  const q2 = mockTest.questions[1];
  const q3 = mockTest.questions[2];

  const studentAnswers = {
    [q1.id]: q1.answerIndex, // correct
    [q2.id]: q2.answerIndex, // correct
    [q3.id]: (q3.answerIndex + 1) % 4 // incorrect
  };

  const evalResult = examAgent.evaluateAnswers(mockTest.questions, studentAnswers);
  assert(evalResult.score === 2, `Exact score computed: ${evalResult.score}/3`);
  assert(evalResult.percentage === 66.7, `Exact percentage computed: ${evalResult.percentage}%`);
  assert(evalResult.weakTopics.length > 0, `Identified weak topic for revision: ${evalResult.weakTopics[0].topic}`);

  // Test 7: Manager Agent End-to-End Orchestration
  console.log('\n--- TEST 7: Manager Agent End-to-End Orchestration ---');
  const complexPrompt = 'I have an upcoming exam on dynamic programming. Can you explain the difference between memoization and tabulation, give me a practice question, and create a study plan?';
  const orchestraRes = await managerAgent.processRequest(complexPrompt);
  
  assert(orchestraRes.activeAgents.length >= 3, `Manager coordinated multiple agents: [${orchestraRes.activeAgents.join(', ')}]`);
  assert(orchestraRes.agentTraces.length >= 3, `Detailed agent execution traces captured (count: ${orchestraRes.agentTraces.length})`);
  assert(orchestraRes.reviewSummary && orchestraRes.reviewSummary.agent === 'Review Agent', 'Review Agent verification integrated into result');
  assert(orchestraRes.message.includes('Dynamic Programming') || orchestraRes.message.includes('Study Plan'), 'Composite synthesized student answer produced');

  console.log('\n=====================================================');
  console.log(`  ALL TESTS FINISHED: ${passedCount} / ${totalCount} PASSED`);
  console.log('=====================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
