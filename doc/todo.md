# Todo
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

Refactor
- try to remove bind:this
- remove setTimeout
- remove all smui Icon and use the one in the helpers
  remove `class="material-icons"` on those elements
