# Todo
Important
- use web worker to encrypt the wallet to not freeze the UI

Bugs
- search then keep the search and try to open a folder
  expected result: clear the search and open the folder
- wrong password, then change method, the lock stay red
  expected behavior: lock reset

Less important
- download image when adding the URL on an account
- grep Todo
- improve readme
- refactor Field.svelte
- empty screen (sample data + "Create ...")
- move additional fields
- account editor: press tab go to next field instead of "Copy" button
- when entering an email, suggest existing email
- view to see leak or duplicated password
- new folder: edit the folder in the list instead opening a dialog
  allow to edit the icon without the dialog (just a select component)
- folders list in mobile view: close when clicking outside
- generate password
- clipboard: find a better solution
  automatically remove the clipboard after 1 minute
- mobile: automatically close the session after a period of inactivity
- change theme color

Refactor
- try to remove bind:this
- remove setTimeout
- remove all smui Icon and use the one in the helpers
  remove `class="material-icons"` on those elements
- firefox in incognito mode: IndexDB and service worker disabled
  show an error message
