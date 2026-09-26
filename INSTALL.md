# INSTALL

Per instalar el servidor simplement cal seguir les següents instruccions:

## Previs:
El sistema en el que volem muntar el servidor ha de tenir instal·lat i en funcionnament :

1. NodeJs  v16.14.0 o superior
2. npm (Node Package Manager) v8.3.0 o superior
3. Servidor de mongoDB (mongod v.2.6.10 o superior) si la base de dades ha de ser local

> **Per què npm 8.3.0.** Les correccions de seguretat de `qs` i `bson`
> s'apliquen amb el camp `overrides` del `package.json`, que npm només té en
> compte a partir de la 8.3.0; un npm anterior l'ignora en silenci i deixa
> instal·lades les versions vulnerables. Node 16.14.0 és la primera versió que
> porta un npm prou nou, i `server/.npmrc` activa `engine-strict` perquè un npm
> més antic es negui a instal·lar en comptes de fer-ho a mitges.


## Instal·lació del servidor :
1. Descarregar de gitHub el fitxer comprimit
2. Descomprimir-lo en la carpeta en la que es vol instal·lar el servidor
3. Situar-se a la carpeta /server
4. Executar:    npm install
   <p> Aquesta instrucció s'encarrega d'instal·lar totes les dependències del projecte de manera automàtica </p>


## Engegar el servidor
  En una terminal del sistema operatiu, executar alguna opció de les següents:

	 * Si es fa ús del servidor de BDD remot es pot usar una instrucció de l'estil de
		MONGODB_URL="mongodb://readwrite:xxxx@ds021462.mlab.com:21462/kpax2" bin/www
		apuntant a l'adreça del servidor mongoDB remot
			on
					xxxx es el pwd
					readwrite l'usuari
					ds021462.mlab.com:21462/kpax2  la base de dades del servidor i 21462 és el port a usar

	* Si es fa ús del servidor local
		executar indistament
			npm start
			o
			/bin/www (des de el directori server)


## Per aturar el servidor:

	Ctrl + C  (en la terminal on està en funcionament)
