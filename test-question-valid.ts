import { db } from './src/lib/db';

async function main() {
  try {
    const test = await db.test.findFirst();
    if (!test) {
      console.log('No tests found in DB');
      return;
    }
    console.log('Found valid test ID:', test.id);
    
    // Attempt to create question with UI default data
    const question = await db.question.create({
      data: {
        type: 'mcq',
        title: 'Test Question from Script',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        option5: '',
        correctOption: '',
        positiveMarks: 1,
        negativeMarks: 0,
        sortOrder: 1,
        testId: test.id,
      }
    });
    console.log('Created question successfully:', question.id);
  } catch (error: any) {
    console.error('Prisma Error:', error.message || error);
  } finally {
    await db.$disconnect();
  }
}

main();
