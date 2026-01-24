export type Language = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko'
export type FidelityLevel = 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Provider = 'gemini' | 'flux'

export interface Session {
  id: string
  created_at: string
  last_active_at: string
  generation_count: number
  max_generations: number
}

export interface Upload {
  id: string
  session_id: string
  storage_path: string
  original_filename: string | null
  mime_type: string
  size_bytes: number
  created_at: string
}

export interface Generation {
  id: string
  session_id: string
  upload_id: string | null
  style_description: string | null
  personal_context: string | null
  language: Language
  status: GenerationStatus
  provider: Provider | null
  created_at: string
  completed_at: string | null
}

export interface StylePreview {
  id: string
  generation_id: string
  style_name: string
  fidelity_level: FidelityLevel
  preview_storage_path: string
  description: string | null
  created_at: string
}

export interface StickerPack {
  id: string
  generation_id: string
  style_preview_id: string | null
  style_name: string
  zip_storage_path: string | null
  marketplace_zip_path: string | null
  created_at: string
}

export interface Sticker {
  id: string
  pack_id: string
  storage_path: string
  sequence_number: number
  emotion: string | null
  has_text: boolean
  text_content: string | null
  prompt_used: string | null
  created_at: string
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session
        Insert: Omit<Session, 'created_at' | 'last_active_at'> & {
          created_at?: string
          last_active_at?: string
        }
        Update: Partial<Session>
      }
      uploads: {
        Row: Upload
        Insert: Omit<Upload, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Upload>
      }
      generations: {
        Row: Generation
        Insert: Omit<Generation, 'id' | 'created_at' | 'completed_at'> & {
          id?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Generation>
      }
      style_previews: {
        Row: StylePreview
        Insert: Omit<StylePreview, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<StylePreview>
      }
      sticker_packs: {
        Row: StickerPack
        Insert: Omit<StickerPack, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<StickerPack>
      }
      stickers: {
        Row: Sticker
        Insert: Omit<Sticker, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Sticker>
      }
    }
  }
}
