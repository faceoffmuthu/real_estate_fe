import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload, Video } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import type { PropertyMedia } from '../../types'
import { recordsApi } from '../../services/api'

const IMAGE_MAX = 8 * 1024 * 1024
const VIDEO_MAX = 100 * 1024 * 1024
const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])

export function RecordMediaPicker({ recordId, media, files, setFiles, disabled, onChanged, required = false, error: requiredError }: {
  recordId?: number
  media: PropertyMedia[]
  files: File[]
  setFiles: (files: File[]) => void
  disabled?: boolean
  onChanged: () => void
  required?: boolean
  error?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const next = files.map(file => URL.createObjectURL(file))
    setUrls(next)
    return () => next.forEach(URL.revokeObjectURL)
  }, [files])

  const add = (selected: FileList | File[]) => {
    setError('')
    const incoming = Array.from(selected)
    let currentImages = media.filter(item => item.media_type === 'image').length + files.filter(file => file.type.startsWith('image/')).length
    let currentVideos = media.filter(item => item.media_type === 'video').length + files.filter(file => file.type.startsWith('video/')).length
    for (const file of incoming) {
      const image = file.type.startsWith('image/')
      const kind = image ? 'image' : 'video'
      const count = image ? currentImages : currentVideos
      if (!validTypes.has(file.type) || file.size > (image ? IMAGE_MAX : VIDEO_MAX)) { setError('Use JPG, PNG, WebP, MP4 or WebM files within the allowed size.'); return }
      if (count >= (image ? 10 : 3)) { setError(`Maximum ${image ? 10 : 3} ${kind}s per property.`); return }
      if (image) currentImages++
      else currentVideos++
    }
    if (files.length + incoming.length > 5) { setError('Add up to five files per save.'); return }
    setFiles([...files, ...incoming])
  }
  const remove = async (item: PropertyMedia) => {
    if (!recordId || disabled) return
    setBusyId(item.id); setError('')
    try {
      if (media.length === 1 && files.length) {
        await recordsApi.uploadMedia(recordId, files)
        setFiles([])
      }
      if (media.length === 1 && !files.length) { setError('A property must keep at least one image or video. Add replacement media before removing this file.'); return }
      await recordsApi.deleteMedia(item.id)
      onChanged()
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not remove this file.') }
    finally { setBusyId(null) }
  }

  return <Card title="Property media" subtitle={`Add up to 10 images and 3 videos. JPG, PNG, WebP, MP4 and WebM are supported.${required ? ' At least one image or video is required.' : ''}`}>
    <div className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50' : 'border-line bg-canvas'}`}
      onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) add(event.dataTransfer.files) }}>
      <Upload className="mx-auto size-6 text-brand-500" />
      <p className="mt-2 text-sm font-medium text-ink">Drag files here or choose from your device</p>
      <p className="mt-1 text-xs text-muted">Images up to 8 MB · Videos up to 100 MB</p>
      <input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={disabled} onChange={event => { if (event.target.files) add(event.target.files); event.target.value = '' }} />
      <Button type="button" className="mt-4" variant="secondary" icon={<ImagePlus className="size-4" />} disabled={disabled} onClick={() => input.current?.click()}>Choose media</Button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    {requiredError && <p role="alert" className="mt-3 text-sm text-danger">{requiredError}</p>}
    {(media.length > 0 || files.length > 0) && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {media.map(item => <div key={`saved-${item.id}`} className="relative overflow-hidden rounded-lg border border-line bg-canvas">
        {item.media_type === 'image' ? <img className="aspect-video w-full object-cover" src={recordsApi.mediaUrl(item.id)} alt="Property" loading="lazy" /> : <video className="aspect-video w-full bg-black object-contain" src={recordsApi.mediaUrl(item.id)} controls preload="metadata" />}
        <div className="flex items-center justify-between gap-2 p-2 text-xs text-muted">{item.media_type === 'image' ? <ImagePlus className="size-4" /> : <Video className="size-4" />}<span>{(item.file_size / 1048576).toFixed(1)} MB</span>
          <Button type="button" variant="ghost" size="sm" disabled={disabled || busyId === item.id} aria-label="Remove media" onClick={() => void remove(item)}><Trash2 className="size-4 text-danger" /></Button></div>
      </div>)}
      {files.map((file, index) => <div key={`${file.name}-${file.lastModified}-${index}`} className="relative overflow-hidden rounded-lg border border-line bg-canvas">
        {file.type.startsWith('image/') ? <img className="aspect-video w-full object-cover" src={urls[index]} alt={file.name} /> : <video className="aspect-video w-full bg-black object-contain" src={urls[index]} controls preload="metadata" />}
        <div className="flex items-center justify-between gap-2 p-2 text-xs text-muted"><span className="truncate">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}><Trash2 className="size-4 text-danger" /></Button></div>
      </div>)}
    </div>}
  </Card>
}
