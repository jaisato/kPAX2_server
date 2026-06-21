# kPAX2_server

This makes the kPAX2 server run by default in port 8081

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

For starting the server:

```bash
$ MONGODB_URL="mongodb://<user>:<password>@<host>:<port>/<database>" bin/www
```

For starting the server with debug

```bash
$ DEBUG=* MONGODB_URL="mongodb://<user>:<password>@<host>:<port>/<database>" bin/www
```

> **Note:** Never commit real database credentials to version control. Use environment variables or a `.env` file (added to `.gitignore`) to manage sensitive configuration.

### Change the port  number

For changing the port number edit the file `server/bin/www`

## API

TODO
