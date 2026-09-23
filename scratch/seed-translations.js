const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.courseLesson.findMany({
    where: { type: 'video' },
  });

  console.log(`Found ${lessons.length} video lessons.`);

  for (const lesson of lessons) {
    console.log(`Seeding translations for lesson: ${lesson.title}`);
    
    // First, clear existing to avoid duplicates if any
    await prisma.videoTranslation.deleteMany({
      where: { lessonId: lesson.id }
    });

    await prisma.videoTranslation.createMany({
      data: [
        {
          lessonId: lesson.id,
          languageCode: "hi",
          languageName: "Hindi",
          subtitleVttUrl: "/mock/subtitles/hi.vtt",
          audioTrackUrl: "/mock/audio/hi.mp3"
        },
        {
          lessonId: lesson.id,
          languageCode: "en",
          languageName: "English",
          subtitleVttUrl: "/mock/subtitles/en.vtt",
          audioTrackUrl: "/mock/audio/en.mp3"
        },
        {
          lessonId: lesson.id,
          languageCode: "es",
          languageName: "Spanish",
          subtitleVttUrl: "/mock/subtitles/es.vtt",
          audioTrackUrl: null // No audio dubbing for Spanish yet
        }
      ]
    });

    await prisma.courseLesson.update({
      where: { id: lesson.id },
      data: { translationStatus: "completed" }
    });
  }

  console.log('Translations seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
