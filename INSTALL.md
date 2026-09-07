# INSTALL

Per instalar el servidor simplement cal seguir les següents instruccions:

## Previs:
El sistema en el que volem muntar el servidor ha de tenir instal·lat i en funcionnament :

1. NodeJs  v16.14.0 o superior
2. npm (Node Package Manager) v8.3.0 o superior
3. Servidor de mongoDB (mongod v.2.6.10 o superior) si la base de dades ha de ser local

> **Per què npm 8.3.0 i no el 3.8.6 que hi deia abans.** La correcció de
> seguretat de `qs` s'aplica a través del camp `overrides` del `package.json`, i
> npm només el té en compte a partir de la 8.3.0. Amb un npm anterior s'ignora
> *en silenci*: express i body-parser resolen `qs` dins del seu propi rang
> `~6.15.1`, la instal·lació acaba sense cap avís, i els dos avisos de seguretat
> que l'`overrides` havia de tancar continuen presents. npm 3 tampoc no coneix
> el `package-lock.json`, de manera que l'arbre fixat en aquest repositori
> també quedaria ignorat. Node 16.14.0 és simplement la primera versió que porta
> un npm prou nou; hi ha `engine-strict` activat, així que un npm que no pugui
> aplicar la correcció es nega a instal·lar en comptes de deixar un arbre que
> només sembla corregit.


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
