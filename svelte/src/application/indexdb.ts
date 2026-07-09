let db: IDBDatabase | undefined = undefined

async function getDb(): Promise<IDBDatabase> {
    if (db) {
        return db
    }
    return await initDb('locky', 1)
}

async function initDb(dbname: string, version: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const indexedDB =
            window.indexedDB ||
            (window as any).mozIndexedDB ||
            (window as any).webkitIndexedDB ||
            (window as any).msIndexedDB
        if (!indexedDB) {
            console.error('IndexDB: not available on your browser')
            reject()
        }
        const request = indexedDB.open(dbname, version)

        request.onerror = (event) => {
            console.error('IndexDB: can not open the database')
            reject(event)
        }

        // web client has no database, initialize
        request.onupgradeneeded = (event) => {
            const oldVersion = event.oldVersion
            console.log('IndexDB: database upgrade, old version:', oldVersion)
            const db = request.result
            if (oldVersion <= 0) {
                db.createObjectStore('keyStore')
            }
        }

        request.onsuccess = (event) => {
            const db = event.target.result
            resolve(db)
        }
    })
}

export async function set(key: IDBValidKey, value: any): Promise<void> {
    const db = await getDb()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['keyStore'], 'readwrite')
        transaction.objectStore('keyStore').put(value, key)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
    })
}

export async function get(key: IDBValidKey): Promise<any> {
    const db = await getDb()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['keyStore'], 'readonly')
        const request = transaction.objectStore('keyStore').get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}
