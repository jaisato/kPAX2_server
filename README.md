
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

`npm audit` está **limpio: 0 advisories**. Se llegó ahí en tres pasos:

1. Retirar `jade`, abandonado desde 2016: arrastraba `transformers` y con él una
   versión vulnerable de `uglify-js`. Por sí solo bajó de **21 advisories (6
   críticos)** a 3 críticos. Las plantillas son ahora `.pug` — mismo lenguaje,
   nombre actual del paquete — y `pug` ya figuraba en `package.json`.
2. Un `overrides` de `bson` a `^1.1.6` cerró esos 3 críticos (deserialización
   de datos no confiables en `bson <= 1.1.3`, GHSA-4jwp-vfvf-657p y
   GHSA-v8w9-2789-6hhr) sin tocar el driver.
3. Subir el driver `mongodb` a la rama **3.x** (ahora `^3.7.4`) cerró el último
   aviso, GHSA-mh5c-679w-hh4r (denegación de servicio en `mongodb < 3.1.13`).

### El driver 3.x

Esta sección decía antes que el driver no se actualizaría: el 4+ es sólo
promesas y obligaría a reescribir toda la API de callbacks que usan `app.js`,
`lib/mongo.js` y las rutas. Eso sigue siendo cierto **para el 4+**, pero pasaba
por alto la rama 3.x, que cierra los mismos avisos y mantiene los callbacks:
`find(query, cb)` sigue entregando el cursor, `cursor.each()` sigue existiendo
y `findOne`, `updateOne` y `findOneAndUpdate` conservan la firma.

El único cambio de comportamiento que importa: en 3.x el callback de
`MongoClient.connect` recibe el **cliente**, no la base de datos. El salto de
2.2.36 a 3.1.13 se fusionó sin ese cambio, así que el servidor arrancaba pero
toda petición que tocaba la base de datos respondía `500` con
`req.db.collection is not a function`. `app.js` obtiene ahora la base de datos
con `client.db()` (el nombre va en la URL de conexión) y, mientras la conexión
no está lista, responde `503` en lugar de dejar que las rutas revienten con un
`db` nulo. Las cabeceras CORS se ponen antes de ese guard para que el `503`
llegue al navegador como tal y no como un fallo opaco de CORS.

En 3.x `collection.update()` queda obsoleto (y desaparece en 4.x); los dos
sitios que aún lo usaban, `POST /game/:id` y `POST /game/:game/unlike`, pasan a
`updateOne` como el resto de escrituras. `unlike` pasaba además `multi: true`
contra un `guid` que identifica un único juego, así que nunca cambió nada.

Sigue sin haber suite de pruebas. La actualización se comprobó arrancando el
servidor contra un MongoDB 4.4 en Docker y ejercitando la API: `GET /game/list`
con y sin filtro (`{"nlikes":{"$lt":15}}`), `$where` rechazado con `400` —también
anidado en un `$or`—, `POST /game/:id`, `GET /game/:id`, `like`/`unlike`
(idempotentes, `nlikes` sube y baja), `DELETE /game/:id`, `POST /user`,
`GET /user/list`, `DELETE /user/:id` y el `503` con cabecera CORS mientras la
conexión no está lista.

### `overrides` y versión de npm

Hay dos `overrides` en `package.json`:

- `qs` a `^6.16.0`: express 4 y body-parser 1 lo fijan en `~6.15`, y las dos
  advisories de esa rama (GHSA-x5fp-wj9c-mxmx y GHSA-4mjr-xmp4-gh2g) se corrigen
  en 6.16.0, que ninguna versión de express 4 exige todavía. La única
  alternativa que ofrece npm es subir a express 5, que es un cambio con rotura.
- `bson` a `^1.1.6`: con `mongodb@3.7` ya se resuelve 1.1.6 por sí solo, así
  que hoy es sólo un suelo; se mantiene para que los dos críticos de
  `bson <= 1.1.3` no vuelvan a entrar por otro dependiente.

`overrides` sólo lo aplica **npm >= 8.3.0**: un npm anterior ignora el campo en
silencio y los avisos siguen ahí aunque `npm install` termine sin quejas. Por
eso `package.json` declara `engines` (Node >= 16.14.0, la primera versión que
trae ese npm) y `server/.npmrc` activa `engine-strict`, que convierte el aviso
en un error de instalación. Ver `INSTALL.md`.

Mientras tanto, el servidor no debe exponerse: no tiene autenticación de ningún
tipo y responde con `Access-Control-Allow-Origin: *`.
