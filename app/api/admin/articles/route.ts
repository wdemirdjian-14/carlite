export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const { title, slug, excerpt, content, imageUrl, category, author, published, featured, readTime, publishDate } = body ?? {};
    if (!title?.trim() || !slug?.trim() || !excerpt?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const article = await prisma.article.create({
      data: {
        title: title?.trim(),
        slug: slug?.trim()?.toLowerCase()?.replace(/\s+/g, '-'),
        excerpt: excerpt?.trim(),
        content: content?.trim(),
        imageUrl: imageUrl ?? '/images/placeholder.jpg',
        category: category ?? 'Actualité',
        author: author ?? 'CARLITE',
        published: !!published,
        featured: !!featured,
        readTime: parseInt(readTime) || 5,
        publishDate: publishDate ? new Date(publishDate) : null,
      },
    });
    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
