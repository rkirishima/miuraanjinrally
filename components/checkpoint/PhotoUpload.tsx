'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, CheckCircle2, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PhotoUploadProps {
  checkpointId: number
  onUploadComplete: (photoUrl: string) => void
  className?: string
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'success' | 'error'

export function PhotoUpload({ checkpointId, onUploadComplete, className }: PhotoUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください')
      setState('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('ファイルサイズは10MB以下にしてください')
      setState('error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setState('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!previewUrl) return
    setState('uploading')
    setUploadProgress(0)

    try {
      // Simulate upload progress
      for (let i = 0; i <= 90; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 80))
        setUploadProgress(i)
      }

      // TODO: Implement actual Supabase Storage upload
      // const { data, error } = await supabase.storage
      //   .from('checkpoint-photos')
      //   .upload(`checkpoint-${checkpointId}/${Date.now()}.jpg`, blob)

      setUploadProgress(100)
      setState('success')

      // Simulate photo URL
      const mockUrl = `https://example.supabase.co/storage/v1/object/public/photos/cp-${checkpointId}.jpg`
      setTimeout(() => {
        onUploadComplete(mockUrl)
      }, 800)
    } catch {
      setState('error')
      setErrorMessage('アップロードに失敗しました。もう一度お試しください。')
    }
  }

  const handleReset = () => {
    setState('idle')
    setPreviewUrl(null)
    setUploadProgress(0)
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className={cn('bg-white rounded-rally-lg border-2 border-rally-beige-dark p-5 shadow-rally', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-rally-gray-dark/10 flex items-center justify-center flex-shrink-0">
          <Camera className="w-4 h-4 text-rally-gray-dark" />
        </div>
        <div>
          <h3 className="font-black text-rally-gray-dark tracking-wide text-sm">
            記念写真を撮影
          </h3>
          <p className="text-rally-gray text-xs">チェックポイントの証拠写真</p>
        </div>
      </div>

      {/* Success state */}
      {state === 'success' && (
        <div className="flex flex-col items-center py-6 gap-3">
          {previewUrl && (
            <div className="w-full aspect-video rounded-rally overflow-hidden mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded checkpoint photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="w-12 h-12 rounded-full bg-rally-green-lighter flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-rally-green" />
          </div>
          <div className="text-center">
            <p className="font-black text-rally-gray-dark">アップロード完了！</p>
            <p className="text-rally-gray text-xs mt-1">写真の提出が完了しました</p>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {state === 'uploading' && (
        <div className="py-4 space-y-4">
          {previewUrl && (
            <div className="w-full aspect-video rounded-rally overflow-hidden opacity-70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploading checkpoint photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rally-gray font-medium flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                アップロード中...
              </span>
              <span className="font-bold text-rally-gray-dark">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-rally-beige-dark/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-rally-blue-dark rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview state */}
      {state === 'preview' && previewUrl && (
        <div className="space-y-4">
          <div className="relative w-full aspect-video rounded-rally overflow-hidden bg-rally-beige-dark/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Photo preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rally-gray-dark/70 text-white flex items-center justify-center hover:bg-rally-gray-dark transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 bg-rally-beige-dark/30 text-rally-gray-dark font-semibold py-3 px-4 rounded-rally text-sm hover:bg-rally-beige-dark/50 transition-colors"
            >
              撮り直す
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 bg-rally-blue-dark text-white font-bold py-3 px-4 rounded-rally text-sm hover:bg-rally-blue-dark/90 active:scale-[0.98] transition-all shadow-rally"
            >
              送信する
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-rally p-3 text-sm text-red-600">
            {errorMessage}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-rally-beige-dark/30 text-rally-gray-dark font-semibold py-3 rounded-rally text-sm hover:bg-rally-beige-dark/50 transition-colors"
          >
            もう一度試す
          </button>
        </div>
      )}

      {/* Idle state */}
      {state === 'idle' && (
        <div className="space-y-3">
          {/* Camera button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-rally-gray-dark text-rally-beige font-bold py-3.5 px-6 rounded-rally text-sm tracking-wide hover:bg-rally-gray-dark/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-rally"
          >
            <Camera className="w-4 h-4" />
            カメラで撮影
          </button>

          {/* File select */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-rally-beige border-2 border-dashed border-rally-beige-dark text-rally-gray-dark font-semibold py-3.5 px-6 rounded-rally text-sm tracking-wide hover:bg-rally-beige-dark/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            ライブラリから選択
          </button>

          {/* Drag & drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-rally-beige-dark/40 rounded-rally p-6 text-center cursor-default"
          >
            <Upload className="w-6 h-6 text-rally-gray mx-auto mb-2" />
            <p className="text-xs text-rally-gray">ここにドラッグ＆ドロップ</p>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          <p className="text-center text-xs text-rally-gray/60">
            JPEG, PNG, WebP（最大10MB）
          </p>
        </div>
      )}
    </div>
  )
}
