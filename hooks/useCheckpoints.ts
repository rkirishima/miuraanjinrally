'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CheckpointWithStatus } from '@/types/database'

export function useCheckpoints(participantId: string) {
  const [checkpoints, setCheckpoints] = useState<CheckpointWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/checkpoints')
      const data = await res.json()
      if (data.checkpoints) setCheckpoints(data.checkpoints)
    } catch (e) {
      setError('チェックポイントの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('completions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkpoint_completions',
        filter: `participant_id=eq.${participantId}`,
      }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [participantId])

  return { checkpoints, loading, error, refetch: fetchData }
}
