// Auto-generated types for MIURA ANJIN RALLY 2026 Supabase schema

export type Database = {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          rider_number: string
          pin_hash: string
          rider_name: string
          motorcycle_make: string | null
          motorcycle_model: string | null
          motorcycle_year: number | null
          emergency_contact: string | null
          emergency_phone: string | null
          is_admin: boolean
          started_at: string | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rider_number: string
          pin_hash: string
          rider_name: string
          motorcycle_make?: string | null
          motorcycle_model?: string | null
          motorcycle_year?: number | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          is_admin?: boolean
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['participants']['Insert']>
        Relationships: []
      }
      checkpoints: {
        Row: {
          id: number
          name: string
          description: string | null
          hint: string
          latitude: number
          longitude: number
          radius_meters: number
          quiz_question: string
          quiz_answer: string
          quiz_answer_aliases: string[] | null
          quiz_choices: string[] | null
          mission_description: string
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: number
          name: string
          description?: string | null
          hint: string
          latitude: number
          longitude: number
          radius_meters?: number
          quiz_question: string
          quiz_answer: string
          quiz_answer_aliases?: string[] | null
          quiz_choices?: string[] | null
          mission_description: string
          order_index: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['checkpoints']['Insert']>
        Relationships: []
      }
      checkpoint_completions: {
        Row: {
          id: string
          participant_id: string
          checkpoint_id: number
          arrived_at: string | null
          quiz_passed_at: string | null
          photo_uploaded_at: string | null
          completed_at: string | null
          photo_url: string | null
          quiz_answer_given: string | null
          gps_lat: number | null
          gps_lon: number | null
        }
        Insert: {
          id?: string
          participant_id: string
          checkpoint_id: number
          arrived_at?: string | null
          quiz_passed_at?: string | null
          photo_uploaded_at?: string | null
          completed_at?: string | null
          photo_url?: string | null
          quiz_answer_given?: string | null
          gps_lat?: number | null
          gps_lon?: number | null
        }
        Update: Partial<Database['public']['Tables']['checkpoint_completions']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'checkpoint_completions_participant_id_fkey'
            columns: ['participant_id']
            referencedRelation: 'participants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'checkpoint_completions_checkpoint_id_fkey'
            columns: ['checkpoint_id']
            referencedRelation: 'checkpoints'
            referencedColumns: ['id']
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          participant_id: string
          checkpoint_id: number
          answer_given: string
          is_correct: boolean
          attempted_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          checkpoint_id: number
          answer_given: string
          is_correct: boolean
          attempted_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_participant_id_fkey'
            columns: ['participant_id']
            referencedRelation: 'participants'
            referencedColumns: ['id']
          }
        ]
      }
      event_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['event_settings']['Insert']>
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// ============================================================
// Convenience row types
// ============================================================

export type Participant = Database['public']['Tables']['participants']['Row']
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
export type ParticipantUpdate = Database['public']['Tables']['participants']['Update']

export type Checkpoint = Database['public']['Tables']['checkpoints']['Row']
export type CheckpointInsert = Database['public']['Tables']['checkpoints']['Insert']
export type CheckpointUpdate = Database['public']['Tables']['checkpoints']['Update']

export type CheckpointCompletion = Database['public']['Tables']['checkpoint_completions']['Row']
export type CheckpointCompletionInsert = Database['public']['Tables']['checkpoint_completions']['Insert']
export type CheckpointCompletionUpdate = Database['public']['Tables']['checkpoint_completions']['Update']

export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row']
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert']

export type EventSetting = Database['public']['Tables']['event_settings']['Row']

// ============================================================
// Application-level types
// ============================================================

export type CheckpointStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'

export type CheckpointWithStatus = Checkpoint & {
  status: CheckpointStatus
  completion?: CheckpointCompletion
  /** Straight-line distance in metres from current GPS position */
  distance?: number
}

export type ParticipantProgress = {
  participant: Participant
  completions: CheckpointCompletion[]
  completedCount: number
  totalCount: number
  isFinished: boolean
}

/** Shape returned by the /api/checkpoints endpoint */
export type CheckpointsResponse = {
  checkpoints: CheckpointWithStatus[]
  totalCount: number
  completedCount: number
}

/** Shape returned by the /api/auth/login endpoint */
export type LoginResponse = {
  participant: Omit<Participant, 'pin_hash'>
  success: true
}

/** Shape of error responses */
export type ApiError = {
  error: string
  success: false
}
