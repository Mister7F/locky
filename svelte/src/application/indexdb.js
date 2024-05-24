let db = null

async function getDb() {
    if (db) {
        return db
    }
    return await initDb('locky', 1)
}

async function initDb(dbname, version) {
    return new Promise((resolve, reject) => {
        const indexedDB =
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB
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

export async function set(key, value) {
    return new Promise((resolve, reject) => {
        getDb().then((db) => {
            const transaction = db.transaction(['keyStore'], 'readwrite')

            transaction.onerror = (event) => {
                reject(event)
            }

            const objectStore = transaction.objectStore('keyStore')
            const request = objectStore.put(value, key)

            request.onsuccess = (event) => {
                resolve(request.result)
            }
            request.onerror = (event) => {
                resolve(event)
            }
            resolve()
        })
    })
}

export async function get(key) {
    return new Promise((resolve, reject) => {
        getDb().then((db) => {
            const transaction = db.transaction(['keyStore'], 'readwrite')

            transaction.onerror = (event) => {
                console.error('IndexDB: can not read the key')
                reject(event)
            }

            const objectStore = transaction.objectStore('keyStore')
            const request = objectStore.get(key)

            request.onsuccess = (event) => {
                resolve(request.result)
            }
            request.onerror = (event) => {
                resolve(event)
            }
        })
    })
}
