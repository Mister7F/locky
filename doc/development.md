# Development

You first need to create the docker image

> `docker build . -t "locky-docker"`

Then you can start the container

> `./docker_start.sh`

Then,

> `npm install`

To run your development server just run,

> `npm run dev -- --port 5000 --host`

Before committing, please run prettier to automatically format your code,

> `npx prettier --write .`

# Build

Run the following command, then deploy the static files (on Github page eg)
> npm run build

(you will need HTTPS for the service worker to work,
you can also increase the cache number in sw.js to not need to clear your browser cache)

## Documentation

## Service workers

Before staring to development, deactivate the service worker, otherwise all files will
be loaded from the cache and you will not see your changes.

In chrome: `Developer console` -> `Application` -> `Service Workers` ->
`Bypass for network`.

If you add a new static file, or if you make call to an API, you might want to have
a look at the service worker (sw.js) to create your cache rule, so the application
can work offline. If needed, increment the cache version.
