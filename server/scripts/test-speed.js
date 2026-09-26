import { composePracticeQuiz } from '../src/quizComposer.js';

async function test() {
  console.log('Testing quiz composition across 1.6M+ question database...');
  for (const country of ['uk', 'nepal', 'india', 'usa', 'japan', 'lifelong']) {
    const t0 = Date.now();
    const questions = await composePracticeQuiz({
      subject: 'science',
      grade: country === 'lifelong' ? 13 : 8,
      country: country === 'lifelong' ? 'global' : country,
    });
    const dt = Date.now() - t0;
    console.log(`[${country.toUpperCase()}] Grade ${country === 'lifelong' ? 13 : 8} - 10 Qs in ${dt}ms | Sample: "${questions[0]?.text_en?.slice(0, 70)}" (Grade: ${questions[0]?.grade}, Subj: ${questions[0]?.subject})`);
  }
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
