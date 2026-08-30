
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

For stating the server:

```bash
$ MONGODB_URL="mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2" bin/www
```

For stating the server with debug

```bash
$ DEBUG=* MONGODB_URL="mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2" bin/www
```

### Change the port  number

For changing the port number edit the file `server/bin/www`

## API

TODO

## Estado de las dependencias (revisión)

`npm audit` pasó de **21 advisories (6 críticos)** a **3 críticos** al retirar
`jade`, abandonado desde 2016: arrastraba `transformers` y con él una versión
vulnerable de `uglify-js`. Las plantillas son ahora `.pug` — mismo lenguaje,
nombre actual del paquete — y `pug` ya figuraba en `package.json`.

Los 3 que quedan vienen todos de `mongodb@2.x` (`mongodb-core`, `bson`,
CVE-2019-2391). No se han cerrado aquí a propósito: el driver 4+ es sólo
promesas y cambia `MongoClient.connect`, la forma de los resultados de
inserción y toda la API de callbacks que usan `app.js`, `lib/mongo.js` y las
rutas. Es una migración con su propio trabajo de verificación y este proyecto no
tiene suite de pruebas contra la que comprobarla, así que hacerla a ciegas sería
peor que dejarla documentada.

Mientras tanto, el servidor no debe exponerse: no tiene autenticación de ningún
tipo y responde con `Access-Control-Allow-Origin: *`.
