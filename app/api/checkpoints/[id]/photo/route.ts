import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isRallyFinished } from '@/lib/checkpoints'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'rally-photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/checkpoints/[id]/photo
 *
 * Accepts multipart/form-data with a single `photo` file field.
 *
 * Workflow:
 *  1. Validates session and checkpoint state (quiz must be passed first).
 *  2. Uploads the file to Supabase Storage at `{rider_number}/{checkpoint_id}_{timestamp}.{ext}`.
 *  3. Sets photo_uploaded_at and completed_at on the completion row.
 *  4. If all checkpoints are completed, sets finished_at on the participant.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Auth check
  let participant: Awaited<ReturnType<typeof requireSession>>
  try {
    participant = await requireSession()
  } catch {
    return NextResponse.json(
      { success: false, error: 'ログインが必要です' },
      { status: 401 }
    )
  }

  const checkpointId = parseInt(params.id, 10)
  if (isNaN(checkpointId)) {
    return NextResponse.json(
      { success: false, error: 'チェックポイントIDが不正です' },
      { status: 400 }
    )
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: 'ファイルの読み取りに失敗しました' },
      { status: 400 }
    )
  }

  const file = formData.get('photo')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'photoフィールドにファイルをセットしてください' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'ファイルサイズは10MB以下にしてください' },
      { status: 413 }
    )
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'JPEG / PNG / WebP / HEIC 形式のみアップロードできます' },
      { status: 415 }
    )
  }

  const adminClient = createAdminClient()

  // Verify the completion row exists and quiz has been passed
  const { data: completion, error: compFetchError } = await adminClient
    .from('checkpoint_completions')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('checkpoint_id', checkpointId)
    .single()

  if (compFetchError || !completion) {
    return NextResponse.json(
      { success: false, error: 'GPS確認とクイズを先に完了してください' },
      { status: 409 }
    )
  }

  if (!completion.arrived_at) {
    return NextResponse.json(
      { success: false, error: 'GPS確認が完了していません' },
      { status: 409 }
    )
  }

  if (!completion.quiz_passed_at) {
    return NextResponse.json(
      { success: false, error: 'クイズに正解してから写真をアップロードしてください' },
      { status: 409 }
    )
  }

  if (completion.photo_uploaded_at) {
    return NextResponse.json(
      { success: false, error: '写真はすでにアップロード済みです' },
      { status: 409 }
    )
  }

  // Build a unique storage path
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const timestamp = Date.now()
  const storagePath = `${participant.rider_number}/${checkpointId}_${timestamp}.${ext}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[POST /api/checkpoints/[id]/photo] storage upload error:', uploadError)
    return NextResponse.json(
      { success: false, error: '写真のアップロードに失敗しました' },
      { status: 500 }
    )
  }

  // Get the public URL
  const { data: publicUrlData } = adminClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  const photoUrl = publicUrlData.publicUrl
  const now = new Date().toISOString()

  // Update completion row
  const { error: updateError } = await adminClient
    .from('checkpoint_completions')
    .update({
      photo_uploaded_at: now,
      completed_at: now,
      photo_url: photoUrl,
    })
    .eq('id', completion.id)

  if (updateError) {
    console.error('[POST /api/checkpoints/[id]/photo] completion update error:', updateError)
    return NextResponse.json(
      { success: false, error: '進捗の更新に失敗しました' },
      { status: 500 }
    )
  }

  // Check if the whole rally is now complete
  const { data: allCompletions } = await adminClient
    .from('checkpoint_completions')
    .select('*')
    .eq('participant_id', participant.id)

  const { data: allCheckpoints } = await adminClient
    .from('checkpoints')
    .select('id')
    .eq('is_active', true)

  // Include the just-completed record (it may not yet reflect in allCompletions)
  const updatedCompletions = (allCompletions ?? []).map((c) =>
    c.id === completion.id ? { ...c, completed_at: now, photo_uploaded_at: now } : c
  )

  const finished = isRallyFinished(updatedCompletions, (allCheckpoints ?? []).length)

  if (finished && !participant.finished_at) {
    await adminClient
      .from('participants')
      .update({ finished_at: now })
      .eq('id', participant.id)
  }

  return NextResponse.json({
    success: true,
    photoUrl,
    completedAt: now,
    rallyFinished: finished,
    message: finished
      ? 'おめでとうございます！全チェックポイントを制覇しました！'
      : '写真のアップロードが完了しました！',
  })
}
