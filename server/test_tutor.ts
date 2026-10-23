import { generateTutorResponse } from './gemini';

async function testMultipleQuestions() {
  console.log('Testing diverse questions on IELTS AI Tutor...\n');

  const q1 = "Writing Task 2 da Introduction qanday yoziladi? Bosqichlarini ko'rsating.";
  console.log(`=== SAVOL 1: "${q1}" ===`);
  const ans1 = await generateTutorResponse('Azizbek', 7.5, [], q1, 'Writing Task 2');
  console.log('JAVOB 1:\n', ans1.substring(0, 300) + '...\n');

  const q2 = "Speaking Part 1 da faqat 'yes' yoki 'no' deb javob bersam ballim tushadimi?";
  console.log(`=== SAVOL 2: "${q2}" ===`);
  const ans2 = await generateTutorResponse('Azizbek', 7.5, [], q2, 'Speaking Part 1');
  console.log('JAVOB 2:\n', ans2.substring(0, 300) + '...\n');

  // Verify that responses are fundamentally different and relevant
  if (ans1 === ans2) {
    throw new Error('FAILED: Responses are identical!');
  }
  if (!ans1.toLowerCase().includes('introduction') && !ans1.toLowerCase().includes('insho') && !ans1.toLowerCase().includes('kirish')) {
    throw new Error('FAILED: Response 1 not related to Introduction!');
  }
  if (!ans2.toLowerCase().includes('speaking') && !ans2.toLowerCase().includes('yes') && !ans2.toLowerCase().includes('nutq') && !ans2.toLowerCase().includes('ball')) {
    throw new Error('FAILED: Response 2 not related to Speaking!');
  }

  console.log('>>> ALL QUESTIONS RETURNED DISTINCT, PROFESSIONAL, RELEVANT ANSWERS! <<<');
}

testMultipleQuestions().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
