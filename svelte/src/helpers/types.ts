export type Color = 'primary' | 'secondary' | 'danger'

export type IconColor =
    | Color
    | 'on-primary'
    | 'on-secondary'
    | 'surface'
    | 'on-surface'
    | 'error'

export type FieldType =
    | 'text'
    | 'text-multiline'
    | 'password'
    | 'email'
    | 'url'
    | 'totp'

export const ACCOUNT_VIEW_MODES = ['detail', 'list', 'minimalist'] as const
export type AccountViewMode = (typeof ACCOUNT_VIEW_MODES)[number]

export function isAccountViewMode(value: unknown): value is AccountViewMode {
    return ACCOUNT_VIEW_MODES.some((mode) => mode === value)
}

export type LoginMethod = 'login' | 'create' | 'upload' | 'dropbox'

export type DropboxState = 'checking' | 'logged' | 'not_logged' | 'no_wallet'
