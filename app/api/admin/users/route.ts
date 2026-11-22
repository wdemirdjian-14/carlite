export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const { name, email, password, role } = body ?? {};
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Email et mot de passe obligatoires' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: email?.trim()?.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email?.trim()?.toLowerCase(),
        password: hashedPassword,
        role: ['admin', 'editor', 'user'].includes(role) ? role : 'user',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
