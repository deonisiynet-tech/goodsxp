import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { path, tag, secret } = body;

    // Перевірка secret token для безпеки
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    // Revalidate by path
    if (path) {
      console.log(`[Revalidate] Starting revalidation for path: ${path}`);
      revalidatePath(path);
      const duration = Date.now() - startTime;
      console.log(`[Revalidate] Completed for path: ${path} in ${duration}ms`);
      return NextResponse.json({ revalidated: true, path, duration });
    }

    // Revalidate by tag
    if (tag) {
      console.log(`[Revalidate] Starting revalidation for tag: ${tag}`);
      revalidateTag(tag);
      const duration = Date.now() - startTime;
      console.log(`[Revalidate] Completed for tag: ${tag} in ${duration}ms`);
      return NextResponse.json({ revalidated: true, tag, duration });
    }

    return NextResponse.json({ error: 'Missing path or tag' }, { status: 400 });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Revalidate] Error after ${duration}ms:`, error);
    return NextResponse.json({
      error: 'Error revalidating',
      message: error.message,
      duration
    }, { status: 500 });
  }
}

// Збільшуємо maxDuration для revalidate route
export const maxDuration = 60; // 60 секунд
export const dynamic = 'force-dynamic';
