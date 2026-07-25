const API_URL = 'https://api.simplelogin.io'

export type AliasSuffix = {
    suffix: string
    signed_suffix: string
}

type AliasOptions = {
    can_create: boolean
    suffixes: AliasSuffix[]
}

export type SimpleLoginMailbox = {
    id: number
    email: string
    default: boolean
    verified: boolean
}

type Mailboxes = {
    mailboxes: SimpleLoginMailbox[]
}

export type SimpleLoginAlias = {
    id: number
    email: string
    enabled: boolean
    mailboxes: {
        id: number
        email: string
    }[]
}

type Aliases = {
    aliases: SimpleLoginAlias[]
}

export async function getAliasOptions(apiKey: string): Promise<{
    suffixes: AliasSuffix[]
    mailboxes: SimpleLoginMailbox[]
    mailboxIds: number[]
}> {
    const [options, mailboxes] = await Promise.all([
        request<AliasOptions>('/api/v5/alias/options', apiKey),
        getMailboxes(apiKey),
    ])

    if (!options.can_create) {
        throw new Error('SimpleLogin cannot create another alias')
    }
    if (!options.suffixes.length) {
        throw new Error('SimpleLogin returned no alias suffix')
    }

    const mailbox = mailboxes[0]
    if (!mailbox) {
        throw new Error('SimpleLogin has no verified mailbox')
    }

    return {
        suffixes: options.suffixes,
        mailboxes,
        mailboxIds: [mailbox.id],
    }
}

export async function getMailboxes(
    apiKey: string
): Promise<SimpleLoginMailbox[]> {
    const result = await request<Mailboxes>('/api/v2/mailboxes', apiKey)
    return result.mailboxes
        .filter((mailbox) => mailbox.verified)
        .sort((a, b) => Number(b.default) - Number(a.default))
}

export async function createAlias(
    apiKey: string,
    prefix: string,
    signedSuffix: string,
    mailboxIds: number[]
): Promise<string> {
    const alias = await request<SimpleLoginAlias>(
        '/api/v3/alias/custom/new',
        apiKey,
        {
            method: 'POST',
            body: JSON.stringify({
                alias_prefix: prefix,
                signed_suffix: signedSuffix,
                mailbox_ids: mailboxIds,
            }),
        }
    )
    return alias.email
}

export async function getAliases(apiKey: string): Promise<SimpleLoginAlias[]> {
    const aliases: SimpleLoginAlias[] = []
    let page = 0

    while (true) {
        const result = await request<Aliases>(
            `/api/v2/aliases?page_id=${page}`,
            apiKey
        )
        aliases.push(...result.aliases)
        if (result.aliases.length < 20) {
            return aliases
        }
        page += 1
    }
}

export async function toggleAlias(
    apiKey: string,
    aliasId: number
): Promise<boolean> {
    const result = await request<{ enabled: boolean }>(
        `/api/aliases/${aliasId}/toggle`,
        apiKey,
        { method: 'POST', body: '{}' }
    )
    return result.enabled
}

export async function trashAlias(
    apiKey: string,
    aliasId: number
): Promise<void> {
    await request(`/api/aliases/${aliasId}`, apiKey, {
        method: 'DELETE',
    })
}

async function request<T>(
    path: string,
    apiKey: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(API_URL + path, {
        ...options,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: {
            Authentication: apiKey,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.error || 'SimpleLogin request failed')
    }
    return result
}
