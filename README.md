
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

`npm audit` está **limpio (0 advisories)**.

Se llegó ahí en dos pasos. El primero fue retirar `jade`, abandonado desde 2016:
arrastraba `transformers` y con él una versión vulnerable de `uglify-js`, y por
sí solo bajó de **21 advisories (6 críticos)** a 3 críticos. Las plantillas son
ahora `.pug` — mismo lenguaje, nombre actual del paquete — y `pug` ya figuraba
en `package.json`.

Los 3 que quedaban venían todos de `mongodb@2.2.36` (`mongodb-core`, `bson`,
CVE-2019-2391) y ya están cerrados: el driver está en **3.7.4**.

Esta sección decía antes que no se cerrarían, porque el driver 4+ es sólo
promesas y obligaría a reescribir toda la API de callbacks que usan `app.js`,
`lib/mongo.js` y las rutas. Ese razonamiento seguía siendo correcto **para el
4+**, pero pasaba por alto la rama 3.x: 3.7.4 cierra exactamente los mismos
avisos y mantiene los callbacks — `find(query, cb)` sigue invocando el callback
con el cursor, y `cursor.each()` sigue existiendo. El único cambio que obligó a
hacer en el código es que en 3.x `MongoClient.connect` entrega el *cliente* y no
la base de datos, de modo que ahora se obtiene con `client.db()`.

Sigue sin haber suite de pruebas, así que la actualización se comprobó con
verificaciones puntuales sobre el propio driver y sobre los caminos que tocan
las rutas, no con un `npm test`. Un repaso manual de `/game/list`, `/user/list`,
`/game/:id/like` y `/game/:id/unlike` contra una base real sigue siendo
recomendable antes de confiar en esta rama.

Aparte del driver, `qs` está fijado a 6.16.0 mediante `overrides`, una versión
que express 4 no puede resolver por su cuenta. Eso **exige npm >= 8.3.0**: con
un npm anterior el campo se ignora en silencio y los avisos siguen ahí. Está
declarado en `engines` y forzado con `engine-strict`; ver `INSTALL.md`.

Mientras tanto, el servidor no debe exponerse: no tiene autenticación de ningún
tipo y responde con `Access-Control-Allow-Origin: *`.
