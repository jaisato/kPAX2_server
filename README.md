
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

Se llegó ahí en tres pasos. El primero fue retirar `jade`, abandonado desde 2016:
arrastraba `transformers` y con él una versión vulnerable de `uglify-js`, y por sí
solo bajó de **21 advisories (6 críticos)** a 3 críticos.

Los 3 críticos eran deserialización de datos no confiables en `bson <= 1.1.3`
(GHSA-4jwp-vfvf-657p y GHSA-v8w9-2789-6hhr), que entra por `mongodb-core`. Se
cerraron primero con un `overrides` de `bson` a `^1.1.6`, sin mover el driver.
Ese `overrides` sigue en `package.json`: con el driver ya en 3.7.4 es redundante
—3.7.4 resuelve bson 1.1.6 por su cuenta— pero es un suelo de seguridad, y
quitarlo debe ser una decisión deliberada y no el efecto colateral de un merge.

Quedaba **GHSA-mh5c-679w-hh4r**, denegación de servicio en `mongodb < 3.1.13`,
en el propio driver. Está cerrado: el driver está en **3.7.4**.

El README decía antes que ese aviso no se cerraría, porque el driver 4+ es sólo
promesas y obligaría a reescribir toda la API de callbacks que usan `app.js`,
`lib/mongo.js` y las rutas. Ese razonamiento seguía siendo correcto **para el
4+**, pero pasaba por alto la rama 3.x: 3.7.4 cierra el mismo aviso y mantiene
los callbacks —`find(query, cb)` sigue invocando el callback con el cursor, y
`cursor.each()` sigue existiendo—.

Lo que la subida a 3.x **sí** obliga a cambiar, y es fácil pasar por alto: en 3.x
`MongoClient.connect` entrega el *cliente*, no la base de datos. `MongoClient` no
tiene método `collection()`, así que dejar `database = db` hace que cada ruta
falle con `TypeError: ... .collection is not a function`. La base se obtiene
ahora con `client.db()`.

Aparte del driver, `qs` está fijado a 6.16.0 mediante `overrides`, una versión
que express 4 no puede resolver por su cuenta. Eso **exige npm >= 8.3.0**: con un
npm anterior el campo se ignora en silencio y los avisos siguen ahí. Está
declarado en `engines` y forzado con `engine-strict`; ver `INSTALL.md`. `morgan`
está en 1.12.0, que cierra GHSA-jxfw-x594-9x9m (log forging por separadores de
línea Unicode sin escapar).

Sigue sin haber suite de pruebas, así que todo esto se comprobó con
verificaciones puntuales sobre el driver y los caminos que tocan las rutas, no
con un `npm test`. Un repaso manual de `/game/list`, `/user/list`,
`/game/:id/like` y `/game/:id/unlike` contra una base real sigue siendo
recomendable.

Mientras tanto, el servidor no debe exponerse: no tiene autenticación de ningún
tipo y responde con `Access-Control-Allow-Origin: *`.
