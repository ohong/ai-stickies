export type Language = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko'
export type FidelityLevel = 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Provider = string

export interface Session {
  id: string
  user_id: string | null
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
  user_id: string | null
  upload_id: string | null
  style_description: string | null
  personal_context: string | null
  language: Language
  status: GenerationStatus
  provider: Provider | null
  created_at: string
  completed_at: string | null
  pack_generation_started_at: string | null
  pack_credit_cost: number
  pack_credits_refunded: number
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  credit_balance: number
  stripe_customer_id: string | null
  created_at: string
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
  is_public: boolean
  share_slug: string | null
  view_count: number
  is_featured: boolean
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

export interface CreditPack {
  id: string
  name: string
  credits: number
  price_cents: number
  stripe_price_id: string
  is_active: boolean
  created_at: string
}

export type PurchaseStatus = 'pending' | 'completed' | 'failed'

export interface Purchase {
  id: string
  user_id: string
  stripe_session_id: string
  credit_pack_id: string
  credits_purchased: number
  amount_cents: number
  status: PurchaseStatus
  created_at: string
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session
        Insert: Omit<Session, 'created_at' | 'last_active_at' | 'user_id'> & {
          created_at?: string
          last_active_at?: string
          user_id?: string | null
        }
        Update: Partial<Session>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & {
          created_at?: string
          credit_balance?: number
          stripe_customer_id?: string | null
        }
        Update: Partial<Profile>
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
        Insert: Omit<Generation, 'id' | 'created_at' | 'completed_at' | 'user_id' | 'pack_generation_started_at' | 'pack_credit_cost' | 'pack_credits_refunded'> & {
          id?: string
          created_at?: string
          completed_at?: string | null
          user_id?: string | null
          pack_generation_started_at?: string | null
          pack_credit_cost?: number
          pack_credits_refunded?: number
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
        Insert: Omit<StickerPack, 'id' | 'created_at' | 'is_public' | 'view_count' | 'is_featured'> & {
          id?: string
          created_at?: string
          is_public?: boolean
          view_count?: number
          is_featured?: boolean
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
      credit_packs: {
        Row: CreditPack
        Insert: Omit<CreditPack, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<CreditPack>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Purchase>
      }
    }
  }
}
