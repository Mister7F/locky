import { normalizeOrigin } from '../helpers/utils'
import type { FieldType } from '../helpers/types.ts'

const FIELD_TYPES: FieldType[] = ['text', 'password', 'email', 'url', 'totp']

function isFieldType(value: unknown): value is FieldType {
    return FIELD_TYPES.some((type) => type === value)
}

export default class Account {
    private __brand!: 'Account'
    id?: string
    name?: string
    login?: string
    password?: string
    folder_id: string
    url?: string
    icon?: string
    totp?: string
    fields: Field[]

    constructor(
        id?: string,
        name?: string,
        login?: string,
        password?: string,
        folder_id?: string,
        url?: string,
        icon?: string,
        totp?: string,
        fields?: Field[]
    ) {
        this.id = id || crypto.randomUUID()
        this.name = name || ''
        this.login = login || ''
        this.password = password || ''
        this.folder_id = folder_id || ''
        this.url = url || ''
        this.icon = icon || ''
        this.totp = totp || ''
        this.fields = fields || []
    }

    static fromJson(values: any): Account {
        return new Account(
            values.id,
            values.name,
            values.login,
            values.password,
            values.folder_id,
            values.url,
            values.icon,
            values.totp,
            (values.fields || []).map((f) => Field.fromJson(f))
        )
    }

    get urls(): string[] {
        const urls = this.fields
            .filter((f) => f.type === 'url' && f.value)
            .map((f) => normalizeOrigin(f.value))
        if (this.url?.length) {
            urls.push(normalizeOrigin(this.url))
        }
        return urls
    }

    get searchableTerms(): string[] {
        return [this.name, ...this.urls]
    }
}

export class Field {
    private __brand!: 'Field'
    name: string
    type: FieldType
    value?: string

    constructor(name?: string, type?: FieldType, value?: string) {
        this.name = name || ''
        this.type = type || 'text'
        this.value = value || ''
    }

    static fromJson(values: any): Field {
        return new Field(
            values.name,
            isFieldType(values.type) ? values.type : 'text',
            values.value
        )
    }
}
