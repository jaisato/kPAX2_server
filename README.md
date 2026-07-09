# kPAX2_server

This makes the kPAX2 server run by default in port 8081

> **Security note:** a real MongoDB connection string (user, password and host) was
> previously committed to this file. Even though it has been removed, it is still
> visible in the git history, so those credentials must be considered compromised:
> rotate or disable them on the database server. Never commit real credentials; pass
> them through the `MONGODB_URL` environment variable instead.

## Execute

### Download

The easiest way to download the server is by cloning it from the GIT repository:

```bash
$ git clone https://github.com/drierat/kPAX2_server.git
```

In order to work in the `devel` branch we specify it: 

```bash
$ git checkout devel
```

### Run the server

Execute the server from the `server/` directory.

You can specify parameters using local environment

1. MONGODB_URL: the mongodb connection URL
2. DEBUG: the prefix for debugin (ex. DEBUG=app*)
3. CORS_ORIGIN: the allowed CORS origin (defaults to `*`)

For stating the server:

```bash
$ MONGODB_URL="mongodb://<user>:<password>@<host>:<port>/kpax2" bin/www
```

For stating the server with debug

```bash
$ DEBUG=* MONGODB_URL="mongodb://<user>:<password>@<host>:<port>/kpax2" bin/www
```

### Change the port  number

For changing the port number edit the file `server/bin/www`

## API

TODO
