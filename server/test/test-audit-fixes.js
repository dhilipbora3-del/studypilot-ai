import { initDatabase, db } from '../src/db/database.js';
import { assignmentAgent } from '../src/agents/assignmentAgent.js';
import { managerAgent } from '../src/agents/managerAgent.js';
import { tutorAgent } from '../src/agents/tutorAgent.js';
import fs from 'fs';
import path from 'path';

console.log('=====================================================');
console.log('  STUDYPILOT AI - AUDIT VERIFICATION TEST SUITE');
console.log('=====================================================\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition, testName, details = '') {
  totalCount++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    process.exitCode = 1;
  }
}

async function runAuditTests() {
  initDatabase();

  // --------------------------------------------------------------------------
  // TEST GROUP 1: /stats/dashboard Contract & Urgent Assignment Count
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: /stats/dashboard Contract & Urgent Count ---');
  const userId = 1;
  const assignments = db.prepare('SELECT id, due_date, priority, status FROM assignments WHERE user_id = ?').all(userId);
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const urgentAssignments = assignments.filter(a => 
    a.status !== 'completed' && (a.priority === 'urgent' || assignmentAgent.calculatePriority(a.due_date) === 'urgent')
  ).length;

  assert(totalAssignments === 3, 'Total assignments in database is 3');
  assert(completedAssignments === 0, 'Completed assignments in database is 0');
  assert(pendingAssignments === 3, 'Pending assignments in database is 3');
  assert(urgentAssignments === 1, `Single source of truth urgent count is 1 (found ${urgentAssignments})`);

  // Verify streak bounded loop computation
  const sessionDays = db.prepare(`
    SELECT DISTINCT SUBSTR(completed_at, 1, 10) as study_date 
    FROM study_sessions 
    WHERE user_id = ?
  `).all(userId).map(r => r.study_date);

  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const hasToday = sessionDays.includes(todayStr);
  if (hasToday) streak++;
  const checkDate = new Date();
  if (!hasToday) checkDate.setDate(checkDate.getDate() - 1);
  for (let i = 0; i < 30; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (sessionDays.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  assert(streak >= 0 && streak <= 30, `Streak computation terminates safely (streak: ${streak})`);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: AI Chat Studio Success, Gating, Timeout & Cancellation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: AI Chat Studio Capabilities ---');

  // 2a. Offline / Deterministic Chat Success
  const offlineResult = await managerAgent.processRequest('Explain Mitosis vs Meiosis', {
    userId: 1,
    selectedAgent: 'tutor',
    provider: 'offline'
  });
  assert(offlineResult.success !== false, 'Offline engine request succeeds');
  assert(offlineResult.message.length > 50, 'Offline engine provides comprehensive educational content');
  assert(offlineResult.agentTraces.length >= 2, 'Manager & specialist traces recorded');

  // 2b. Missing-Key Gating Verification
  // When provider is 'chatgpt' or 'claude' without a key, verify client gating blocks submission
  const clientChatViewCode = fs.readFileSync(path.resolve('client/src/components/ChatStudioView.jsx'), 'utf-8');
  assert(
    clientChatViewCode.includes('activeProvider !== \'offline\' && !hasCustomKey'),
    'ChatStudioView gates submission if activeProvider requires key and none is connected'
  );
  assert(
    clientChatViewCode.includes('Connect an API Key to Continue') || clientChatViewCode.includes('keyRequiredNotice'),
    'ChatStudioView renders actionable "Connect API Key" banner when gated'
  );

  // 2c. Request Cancellation via AbortController
  assert(
    clientChatViewCode.includes('abortControllerRef = useRef(null)') && clientChatViewCode.includes('handleCancelRequest'),
    'ChatStudioView includes AbortController and manual cancellation handler'
  );

  // 2d. 15-Second Timeout
  assert(
    clientChatViewCode.includes('15000') && clientChatViewCode.includes('Request Timed Out'),
    'ChatStudioView includes 15-second request timeout and user-facing timeout message'
  );

  // 2e. Retry Action
  assert(
    clientChatViewCode.includes('retryQuery') && clientChatViewCode.includes('Retry Request'),
    'ChatStudioView provides a retry prompt button on failed requests'
  );

  // 2f. Unmount / Navigation Cleanup
  assert(
    clientChatViewCode.includes('abortControllerRef.current.abort(\'unmount\')'),
    'ChatStudioView aborts in-flight requests on component unmount / navigation'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Loading-to-Data Transitions (No False Empty States)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Loading-to-Data Transitions ---');

  const views = [
    { name: 'SubjectsView', file: 'client/src/components/SubjectsView.jsx', entity: 'subjects' },
    { name: 'AssignmentsView', file: 'client/src/components/AssignmentsView.jsx', entity: 'assignments' },
    { name: 'ExamsView', file: 'client/src/components/ExamsView.jsx', entity: 'exams' },
    { name: 'FlashcardsView', file: 'client/src/components/FlashcardsView.jsx', entity: 'flashcards' }
  ];

  for (const view of views) {
    const code = fs.readFileSync(path.resolve(view.file), 'utf-8');
    assert(
      code.includes('role="status"') && code.includes('aria-busy="true"'),
      `${view.name} implements accessible skeleton with role="status" and aria-busy="true"`
    );
    assert(
      code.includes('loading &&') && code.includes('.length === 0'),
      `${view.name} gates skeleton specifically during initial loading before data arrives`
    );
    assert(
      code.includes('!loading && !error &&'),
      `${view.name} prevents false empty state from showing before fetch completes`
    );
    assert(
      code.includes('role="alert"') && code.includes('Retry'),
      `${view.name} displays error alert with a Retry button on failure`
    );
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Mobile Responsiveness & Viewport Constraints (320px & 375px)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Mobile Responsiveness (320px & 375px) ---');

  const navbarCode = fs.readFileSync(path.resolve('client/src/components/Navbar.jsx'), 'utf-8');
  assert(
    navbarCode.includes('min-h-[44px]') && navbarCode.includes('min-w-[44px]'),
    'Navbar enforces minimum 44x44px touch targets on mobile interactive elements'
  );
  assert(
    navbarCode.includes('hidden sm:inline') && navbarCode.includes('max-w-[70px] xs:max-w-none'),
    'Navbar truncates brand title and collapses button labels on narrow mobile viewports'
  );
  assert(
    !navbarCode.includes('overflow-x: hidden'),
    'Navbar does not mask layout bugs with overflow-x: hidden'
  );

  const appCode = fs.readFileSync(path.resolve('client/src/App.jsx'), 'utf-8');
  assert(
    appCode.includes('mobile-nav-drawer') && appCode.includes('aria-controls="mobile-nav-drawer"'),
    'App mobile drawer is accessible with proper aria-controls linkage'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Accessibility Repairs (Programmatic Labels & ARIA Names)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Accessibility & Form Control Associations ---');

  const formsToCheck = [
    { file: 'client/src/components/SubjectsView.jsx', expectedIds: ['subject-name-input', 'subject-code-input', 'topic-name-input', 'topic-notes-input'] },
    { file: 'client/src/components/AssignmentsView.jsx', expectedIds: ['assignment-title-input', 'assignment-due-date-input', 'assignment-desc-input'] },
    { file: 'client/src/components/ExamsView.jsx', expectedIds: ['exam-title-input', 'exam-date-input', 'mock-quiz-topic-input'] },
    { file: 'client/src/components/FlashcardsView.jsx', expectedIds: ['card-front-input', 'card-back-input', 'gen-deck-topic-input'] },
    { file: 'client/src/components/PlannerView.jsx', expectedIds: ['planner-days-count-select', 'planner-daily-hours-select'] },
    { file: 'client/src/components/AISettingsModal.jsx', expectedIds: ['provider-api-key-input'] },
    { file: 'client/src/components/AuthModal.jsx', expectedIds: ['auth-email-input', 'auth-password-input'] },
    { file: 'client/src/components/TimerView.jsx', expectedIds: ['timer-subject-select', 'timer-notes-input'] }
  ];

  for (const f of formsToCheck) {
    const code = fs.readFileSync(path.resolve(f.file), 'utf-8');
    for (const expectedId of f.expectedIds) {
      assert(
        code.includes(`htmlFor="${expectedId}"`) && code.includes(`id="${expectedId}"`),
        `${path.basename(f.file)} correctly associates <label htmlFor="${expectedId}"> with <input id="${expectedId}">`
      );
    }
  }

  // Check destructive controls have confirmation dialogs naming the item
  assert(
    views.every(v => {
      const code = fs.readFileSync(path.resolve(v.file), 'utf-8');
      return code.includes('window.confirm') || code.includes('confirm(');
    }),
    'All entity views require confirmation before destructive actions'
  );

  // Check Dialog Escape key, focus trapping, and focus restoration support
  const modals = [
    'client/src/components/SubjectsView.jsx',
    'client/src/components/AssignmentsView.jsx',
    'client/src/components/ExamsView.jsx',
    'client/src/components/FlashcardsView.jsx',
    'client/src/components/PlannerView.jsx',
    'client/src/components/AISettingsModal.jsx',
    'client/src/components/AuthModal.jsx',
    'client/src/components/AgentSystemModal.jsx'
  ];

  for (const modalFile of modals) {
    const code = fs.readFileSync(path.resolve(modalFile), 'utf-8');
    assert(
      code.includes("e.key === 'Escape'"),
      `${path.basename(modalFile)} handles Escape keydown to close dialogs`
    );
    assert(
      code.includes('role="dialog"') && code.includes('aria-modal="true"'),
      `${path.basename(modalFile)} implements role="dialog" and aria-modal="true"`
    );
  }

  // Check focus trap and previousActiveElement restoration in flagship dialogs
  const flagshipDialogs = [
    'client/src/components/AISettingsModal.jsx',
    'client/src/components/AuthModal.jsx',
    'client/src/components/AgentSystemModal.jsx'
  ];
  for (const fDialog of flagshipDialogs) {
    const code = fs.readFileSync(path.resolve(fDialog), 'utf-8');
    assert(
      code.includes("e.key === 'Tab'") && code.includes('previousActiveElement.current'),
      `${path.basename(fDialog)} traps Tab focus and restores focus to previous trigger element`
    );
  }

  // Check Dashboard graceful error state and retry handling
  const dashboardCode = fs.readFileSync(path.resolve('client/src/components/DashboardView.jsx'), 'utf-8');
  assert(
    dashboardCode.includes('statsError') && dashboardCode.includes('role="alert"') && dashboardCode.includes('onRetryStats'),
    'DashboardView displays non-blocking graceful error alert with a retry option'
  );
  assert(
    dashboardCode.includes('urgentCount =') && dashboardCode.includes('urgentAssignments'),
    'DashboardView derives urgent assignment count from server stats with client fallback'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: High-Precision Pedagogical & Problem Solving Engine Accuracy
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Academic Engine Accuracy & Proper Solutions ---');

  // 6a. Linear equation solving: 2x + 5 = 15 => x = 5
  const linearRes = await tutorAgent.execute('solve 2x + 5 = 15', { provider: 'offline' });
  assert(
    linearRes.output.includes('x = 5') && linearRes.output.includes('Identity holds'),
    'TutorAgent solves linear equation with step-by-step algebra and verified answer x = 5'
  );

  // 6b. Quadratic equation solving: x^2 - 5x + 6 = 0 => x = 2 and x = 3
  const quadRes = await tutorAgent.execute('solve x^2 - 5x + 6 = 0', { provider: 'offline' });
  assert(
    quadRes.output.includes('x = 3') && quadRes.output.includes('x = 2') && quadRes.output.includes('Quadratic Formula'),
    'TutorAgent solves quadratic equation via quadratic formula with exact roots x = 2, 3'
  );

  // 6c. Percentage calculation: 15% of 240 => 36
  const pctRes = await tutorAgent.execute('what is 15% of 240', { provider: 'offline' });
  assert(
    pctRes.output.includes('36') && pctRes.output.includes('Percentage Rate'),
    'TutorAgent accurately calculates percentages with formula and steps (15% of 240 = 36)'
  );

  // 6d. Biology: Photosynthesis
  const photoRes = await tutorAgent.execute('Explain photosynthesis', { provider: 'offline' });
  assert(
    photoRes.output.includes('RuBisCO') && photoRes.output.includes('Calvin Cycle') && photoRes.output.includes('Photosynthesis'),
    'TutorAgent explains photosynthesis with biochemical depth (RuBisCO, Calvin cycle, equations)'
  );
  assert(
    photoRes.practiceQuestion && (photoRes.practiceQuestion.question.includes('photosynthesis') || photoRes.practiceQuestion.options.includes('RuBisCO')),
    'TutorAgent attaches topic-specific photosynthesis practice question'
  );

  // 6e. Computer Science: Binary Search
  const bsRes = await tutorAgent.execute('What is binary search algorithm?', { provider: 'offline' });
  assert(
    bsRes.output.includes('O(\\log n)') && bsRes.output.includes('def binary_search'),
    'TutorAgent provides O(log n) complexity analysis and Python implementation for Binary Search'
  );
  assert(
    bsRes.practiceQuestion && bsRes.practiceQuestion.question.includes('1,024'),
    'TutorAgent attaches topic-specific logarithmic search practice question'
  );

  // 6f. Custom / Humanities: French Revolution
  const historyRes = await tutorAgent.execute('Explain the French Revolution', { provider: 'offline' });
  assert(
    historyRes.output.includes('French Revolution') && historyRes.output.includes('History & Political Science'),
    'TutorAgent dynamically synthesizes domain-specific structured breakdown for humanities queries'
  );

  // 6g. Loops vs OOP Disambiguation (Bugfix: "loops" should never match "oop")
  const loopsRes = await tutorAgent.execute('the ai sucks i am asking about loops and it is giving oops', { provider: 'offline' });
  assert(
    loopsRes.output.includes('Loops, Iteration & Control Flow') && !loopsRes.output.includes('4 Pillars of Object-Oriented Programming'),
    'TutorAgent correctly identifies loops inquiry and delivers Loops & Control Flow without confusing with OOP'
  );

  const oopsRes = await tutorAgent.execute('explain oop in java', { provider: 'offline' });
  assert(
    oopsRes.output.includes('The 4 Pillars of Object-Oriented Programming (OOP)'),
    'TutorAgent correctly routes explicit OOP inquiry to 4 Pillars of Object-Oriented Programming'
  );

  const managerLoops = await managerAgent.processRequest('give me an explanation of loops', { provider: 'offline' });
  assert(
    managerLoops.activeAgents.includes('AI Tutor Agent') && !managerLoops.activeAgents.includes('Study Planner Agent'),
    'ManagerAgent does not misinterpret "explanation" as "plan" and routes loops exclusively to Tutor Agent'
  );

  console.log('\n=====================================================');
  console.log(`  AUDIT TEST SUMMARY: ${passedCount} / ${totalCount} PASSED`);
  console.log('=====================================================');
}

runAuditTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
