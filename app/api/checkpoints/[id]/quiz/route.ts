import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAnswer, getCheckpointStatus } from '@/lib/checkpoints'

export const runtime = 'nodejs'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/checkpoints/[id]/quiz
 *
 * Body: { answer: string }
 *
 * Validates the quiz answer for the given checkpoint:
 *  - Logs the attempt in quiz_attempts.
 *  - On correct answer, sets quiz_passed_at on the completion row.
 *  - Returns { correct: boolean, message?: string }.
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

  let body: { answer?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'リクエストが不正です' },
      { status: 400 }
    )
  }

  const { answer } = body
  if (!answer || typeof answer !== 'string' || answer.trim() === '') {
    return NextResponse.json(
      { success: false, error: '回答を入力してください' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Fetch the checkpoint
  const { data: checkpoint, error: cpError } = await adminClient
    .from('checkpoints')
    .select('*')
    .eq('id', checkpointId)
    .single()

  if (cpError || !checkpoint) {
    return NextResponse.json(
      { success: false, error: 'チェックポイントが見つかりません' },
      { status: 404 }
    )
  }

  // Fetch all completions to determine unlock state
  const { data: allCompletions } = await adminClient
    .from('checkpoint_completions')
    .select('*')
    .eq('participant_id', participant.id)

  const { data: allCheckpoints } = await adminClient
    .from('checkpoints')
    .select('*')
    .eq('is_active', true)

  const status = getCheckpointStatus(
    checkpoint,
    allCompletions ?? [],
    allCheckpoints ?? []
  )

  if (status === 'locked') {
    return NextResponse.json(
      { success: false, error: 'このチェックポイントはまだ解放されていません' },
      { status: 403 }
    )
  }

  if (status === 'completed') {
    return NextResponse.json(
      { success: false, error: 'このチェックポイントはすでに完了しています' },
      { status: 409 }
    )
  }

  // Ensure the participant has an in-progress (arrived) completion row
  const existingCompletion = (allCompletions ?? []).find(
    (c) => c.checkpoint_id === checkpointId
  )
  if (!existingCompletion || !existingCompletion.arrived_at) {
    return NextResponse.json(
      { success: false, error: 'まずGPS確認が必要です' },
      { status: 409 }
    )
  }

  // Check if quiz already passed
  if (existingCompletion.quiz_passed_at) {
    return NextResponse.json(
      { success: false, error: 'クイズはすでに回答済みです' },
      { status: 409 }
    )
  }

  // Evaluate the answer
  const isCorrect = checkAnswer(
    answer,
    checkpoint.quiz_answer,
    checkpoint.quiz_answer_aliases
  )

  // Log the attempt
  const { error: attemptError } = await adminClient.from('quiz_attempts').insert({
    participant_id: participant.id,
    checkpoint_id: checkpointId,
    answer_given: answer.trim(),
    is_correct: isCorrect,
  })

  if (attemptError) {
    console.error('[POST /api/checkpoints/[id]/quiz] attempt insert error:', attemptError)
  }

  if (!isCorrect) {
    return NextResponse.json({
      success: true,
      correct: false,
      message: '不正解です。もう一度試してください。',
    })
  }

  // Mark quiz_passed_at on the completion row
  const { error: updateError } = await adminClient
    .from('checkpoint_completions')
    .update({
      quiz_passed_at: new Date().toISOString(),
      quiz_answer_given: answer.trim(),
    })
    .eq('id', existingCompletion.id)

  if (updateError) {
    console.error('[POST /api/checkpoints/[id]/quiz] completion update error:', updateError)
    return NextResponse.json(
      { success: false, error: '進捗の更新に失敗しました' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    correct: true,
    message: '正解です！次は写真をアップロードしてください。',
  })
}
