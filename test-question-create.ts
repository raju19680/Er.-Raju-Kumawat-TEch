import { db } from './src/lib/db';

async function main() {
  try {
    const questionCount = await db.question.count();
    console.log('Total questions:', questionCount);
    
    // Attempt to create question with dummy data
    const question = await db.question.create({
      data: {
        type: 'mcq',
        title: 'Test Question',
        testId: 'non-existent-test-id' // Testing with invalid testId
      }
    });
    console.log('Created question:', question);
  } catch (error: any) {
    console.error('Prisma Error:', error.message || error);
  } finally {
    await db.$disconnect();
  }
}

main();
