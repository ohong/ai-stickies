'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LANGUAGES, LANGUAGE_CODES } from '@/src/constants/languages'
import type { Language } from '@/src/types'

interface LanguageSelectProps {
  value: Language
  onChange: (value: Language) => void
  disabled?: boolean
}

export function LanguageSelect({
  value,
  onChange,
  disabled,
}: LanguageSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Sticker Text Language
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as Language)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_CODES.map((code) => {
            const lang = LANGUAGES[code]
            return (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <span>{lang.nativeLabel}</span>
                  {lang.label !== lang.nativeLabel && (
                    <span className="text-muted-foreground text-xs">({lang.label})</span>
                  )}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Text on your stickers will be in this language
      </p>
    </div>
  )
}
