// templates/server-action.ts
// Standard server action pattern with zod validation
// Use for form submissions and mutations from the same Next.js app

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// 1. Define input schema
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// 2. Define return type — discriminated union for predictable error handling
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// 3. The action itself
export async function createProject(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  // Auth check first — fail fast
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Parse and validate input
  const parsed = CreateProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Do the work
  try {
    const project = await db
      .insertInto('projects')
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        user_id: session.user.id,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    revalidatePath('/dashboard');
    return { success: true, data: { id: project.id } };
  } catch (err) {
    console.error('createProject failed:', err);
    return { success: false, error: 'Failed to create project' };
  }
}
