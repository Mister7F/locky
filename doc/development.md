# Development
First, install `npm`

Then,
> `cd web && npm install`

To run your development server just run,
> `npm run dev`

Before committing, please run prettier to automatically format your code,
> `npm run prettier`

## Documentation

## Service workers

Before staring to development, deactivate the service worker, otherwise all files will
be loaded from the cache and you will not see your changes.

In chrome: `Developer console` -> `Application` -> `Service Workers` ->
`Bypass for network`.

If you add a new static file, or if you make call to an API, you might want to have
a look at the service worker (sw.js) to create your cache rule, so the application
can work offline. If needed, increment the cache version.
