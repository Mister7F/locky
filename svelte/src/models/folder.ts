export default class Folder {
    private __brand!: 'Folder'
    id: string
    name: string
    icon?: string

    constructor(id?: string, name?: string, icon?: string) {
        this.id = id || crypto.randomUUID()
        this.name = name || ''
        this.icon = icon || ''
    }

    static fromJson(values: any): Folder {
        return new Folder(values.id, values.name, values.icon)
    }
}
