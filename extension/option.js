document.body.onload = () => {
    document.querySelector('input').addEventListener('input', (event) => {
        chrome.storage.sync.set({ lockyUrl: event.target.value })
    })

    // `storage.sync` will be synced across all browser
    chrome.storage.sync.get('lockyUrl').then((value) => {
        document.querySelector('input').value = value.lockyUrl || ''
    })
}
