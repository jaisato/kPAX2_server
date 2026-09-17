
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

De esos 3 críticos ya no queda ninguno. Los tres eran deserialización de datos
no confiables en `bson <= 1.1.3` (GHSA-4jwp-vfvf-657p y GHSA-v8w9-2789-6hhr),
que entra por `mongodb-core`, que lo fija en `~1.0.4`. La corrección está en
1.1.4 y **dentro de la misma rama mayor**, así que un `overrides` a `^1.1.6` la
aplica sin tocar el driver: 1.1.6 es la última 1.x y mantiene la API que usa
`mongodb-core@2.1.20`. Comprobado con el driver cargado —serialización y
deserialización de ida y vuelta, fechas anidadas y `ObjectId` incluidos.

Queda **1 advisory alto**: GHSA-mh5c-679w-hh4r, denegación de servicio en
`mongodb < 3.1.13`. Ese sí está en el propio driver y no se cierra aquí a
propósito: el 4+ es sólo promesas y cambia `MongoClient.connect`, la forma de
los resultados de inserción y toda la API de callbacks que usan `app.js`,
`lib/mongo.js` y las rutas. Es una migración con su propio trabajo de
verificación y este proyecto no tiene suite de pruebas contra la que
comprobarla, así que hacerla a ciegas sería peor que dejarla documentada.

También hay un `overrides` de `qs` a `^6.16.0`: express 4 y body-parser 1 lo
fijan en `~6.15`, y las dos advisories de esa rama (GHSA-x5fp-wj9c-mxmx y
GHSA-4mjr-xmp4-gh2g) se corrigen en 6.16.0, que ninguna versión de express 4
exige todavía. La única alternativa que ofrece npm es subir a express 5, que es
un cambio con rotura.

Mientras tanto, el servidor no debe exponerse: no tiene autenticación de ningún
tipo y responde con `Access-Control-Allow-Origin: *`.
