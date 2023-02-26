# Installation
> cargo install wasm-pack

# Run tests
> cargo test --release

Test the JS functions
> python -m http.server

# Compile
> wasm-pack build --target web --release

# Format code
> rustfmt src/*

# Note
Password derivation take ~200ms in Javascript, but 1300ms in Web assembly...
