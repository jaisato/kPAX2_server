# INSTALL

Per instalar el servidor simplement cal seguir les següents instruccions:

## Previs:
El sistema en el que volem muntar el servidor ha de tenir instal·lat i en funcionnament :

1. NodeJs  v6.0.0 o superior
2. npm (Node Package Manager) v3.8.6 o superior
3. Servidor de mongoDB (mongod v.2.6.10 o superior) si la base de dades ha de ser local


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
