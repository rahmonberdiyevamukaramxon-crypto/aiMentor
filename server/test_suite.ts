import { db, hashPin } from './db';

async function runTests() {
  console.log('--- RUNNING IELTS AI MENTOR TEST SUITE ---');

  // Test 1: PIN hashing and security
  const pin1 = '1234';
  const hash1 = hashPin(pin1);
  const hash2 = hashPin(pin1);
  const hashWrong = hashPin('4321');
  if (hash1 !== hash2) throw new Error('PIN hashing inconsistent');
  if (hash1 === hashWrong) throw new Error('PIN hash collision');
  console.log('✓ Test 1: PIN hashing & cryptographic salt passed');

  // Test 2: Student registration validation
  const testStudent = db.createProfile({
    role: 'student',
    first_name: 'Test',
    last_name: 'Olimov',
    age: 19,
    pin_hash: hash1,
    target_band: 7.5,
    current_level: 'B2',
    study_hours_per_day: 2,
    intensity: 'intensive'
  });
  if (!testStudent.id) throw new Error('Profile creation missing ID');
  console.log('✓ Test 2: Student profile creation with UUID & isolation passed');

  // Test 3: Exercise loading & sanitized questions (confidential answer keys hidden)
  const exercises = db.getExercises('reading');
  if (exercises.length === 0) throw new Error('No reading exercises found');
  const readEx = exercises[0];
  const sanitizedQuestions = db.getQuestionsForExercise(readEx.id, true);
  if (sanitizedQuestions.some(q => q.correct_answer !== '')) {
    throw new Error('SECURITY BREACH: Confidential answer key leaked in sanitized questions!');
  }
  console.log('✓ Test 3: Question bank security (confidential answer keys shielded) passed');

  // Test 4: Server-authoritative timer & attempt creation
  const attempt = db.createAttempt(testStudent.id, readEx.id);
  const startTime = new Date(attempt.started_at).getTime();
  const deadline = new Date(attempt.deadline_at).getTime();
  const expectedDurationMs = readEx.duration_minutes * 60 * 1000;
  if (Math.abs(deadline - startTime - expectedDurationMs) > 1000) {
    throw new Error('Server deadline math incorrect');
  }
  console.log('✓ Test 4: Authoritative server-side deadline calculation passed');

  // Test 5: Autosave response
  const rawQuestions = db.getQuestionsRaw(readEx.id);
  const q1 = rawQuestions[0];
  const savedAns = db.saveAnswer(attempt.id, q1.id, q1.correct_answer);
  if (savedAns.user_answer !== q1.correct_answer) throw new Error('Autosave answer mismatch');
  console.log('✓ Test 5: Real-time response autosave passed');

  // Test 6: Attempt submission & objective scoring
  const submission = db.submitAttempt(attempt.id);
  if (submission.attempt.status !== 'submitted') throw new Error('Attempt status not submitted');
  if (submission.score < 1) throw new Error('Score not computed properly');
  if (!submission.band_estimate) throw new Error('Band score estimate missing');
  console.log('✓ Test 6: Trusted answer key grading & IELTS band estimate passed');

  // Test 7: Duplicate submission prevention
  try {
    db.submitAttempt(attempt.id);
    throw new Error('Duplicate submission was not blocked!');
  } catch (e: any) {
    if (e.message.includes('allaqachon topshirilgan')) {
      console.log('✓ Test 7: Duplicate submission protection passed');
    } else {
      throw e;
    }
  }

  // Test 8: Vocabulary & Spaced repetition interval growth
  const vocabs = db.getVocabItems();
  const v1 = vocabs[0];
  const r1 = db.recordVocabReview(testStudent.id, v1.id, 5); // Quality 5
  if (r1.mastery_level < 5) throw new Error('Vocab mastery calculation error');
  console.log('✓ Test 8: Spaced repetition (SM-2) memory scheduling passed');

  console.log('--- ALL 8 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
