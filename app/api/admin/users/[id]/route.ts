export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    const body = await request?.json?.();
    const updateData: any = {};
    if (body?.name !== undefined) updateData.name = body.name;
    if (body?.email !== undefined) updateData.email = body.email?.trim()?.toLowerCase();
    if (body?.role !== undefined && ['admin', 'editor', 'user'].includes(body.role)) updateData.role = body.role;
    if (body?.password?.trim()) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    const updated = await prisma.user.update({
      where: { id: params?.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    // Prevent deleting self
    if ((session?.user as any)?.id === params?.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
}
