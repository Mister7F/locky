#!/bin/sh
set -eu

extension_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
archive_path="$extension_dir/../firefox-locky.xpi"
package_dir=$(mktemp -d)
trap 'rm -rf "$package_dir"' EXIT

cp "$extension_dir"/*.html "$package_dir/"
cp "$extension_dir/background.firefox.js" "$package_dir/"
cp "$extension_dir/content.js" "$package_dir/"
cp "$extension_dir/crypto.js" "$package_dir/"
cp "$extension_dir/option.js" "$package_dir/"
cp "$extension_dir/popup.js" "$package_dir/"
cp "$extension_dir/utils.js" "$package_dir/"
cp -R "$extension_dir/icons" "$package_dir/"
cp "$extension_dir/manifest.firefox.json" "$package_dir/manifest.json"

(
    cd "$package_dir"
    zip -q -r -FS "$archive_path" .
)

echo "$archive_path"
