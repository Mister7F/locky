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
}

export class Field {
    private __brand!: 'Field'
    name: string
    type: string
    value?: string

    constructor(name?: string, type?: string, value?: string) {
        this.name = name || ''
        this.type = type || ''
        this.value = value || ''
    }

    static fromJson(values: any): Field {
        return new Field(values.name, values.type, values.value)
    }
}
