export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lessonId } = await params;

    // Validate lesson
    const lesson = await db.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.module.course.organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (lesson.type !== "video" || !lesson.videoUrl) {
      return NextResponse.json({ error: "Only video lessons can be translated" }, { status: 400 });
    }

    // Update status to processing
    await db.courseLesson.update({
      where: { id: lessonId },
      data: { translationStatus: "processing" }
    });

    // In a real production app, we would enqueue a BullMQ or AWS SQS job here.
    // For now, we'll simulate a background job that completes after a delay.
    
    // Simulate background processing (do NOT await this so the API responds immediately)
    simulateTranslationJob(lessonId).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      message: "Translation job queued successfully",
      status: "processing"
    });

  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function simulateTranslationJob(lessonId: string) {
  console.log(`[Translation Job] Started for lesson ${lessonId}`);
  
  // Simulate 10-second processing time
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Create mock translation records
  await db.videoTranslation.createMany({
    data: [
      {
        lessonId,
        languageCode: "hi",
        languageName: "Hindi",
        subtitleVttUrl: "/mock/subtitles/hi.vtt",
        audioTrackUrl: "/mock/audio/hi.mp3"
      },
      {
        lessonId,
        languageCode: "en",
        languageName: "English",
        subtitleVttUrl: "/mock/subtitles/en.vtt",
        audioTrackUrl: "/mock/audio/en.mp3"
      },
      {
        lessonId,
        languageCode: "es",
        languageName: "Spanish",
        subtitleVttUrl: "/mock/subtitles/es.vtt",
        audioTrackUrl: null // No audio dubbing for Spanish yet
      }
    ]
  });

  // Update status to completed
  await db.courseLesson.update({
    where: { id: lessonId },
    data: { translationStatus: "completed" }
  });
  
  console.log(`[Translation Job] Completed for lesson ${lessonId}`);
}

