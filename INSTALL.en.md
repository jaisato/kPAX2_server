# INSTALL

To install the server simply follow this instructions

## Previous

The system in which the server will be installed, must have the following components working properly:

1. NodeJs v16.14.0 or higher
2. npm (Node Package Manager) v8.3.0 or higher
3. MongoDB Server (mongod v.2.6.10 or higher, only if you want to work on a local database)

> **Why npm 8.3.0.** The `qs` and `bson` security fixes are applied through the
> `overrides` field in `package.json`, which npm only honours from 8.3.0 on; an
> older npm ignores it silently and installs the vulnerable versions. Node
> 16.14.0 is the first release that ships a new enough npm, and `server/.npmrc`
> sets `engine-strict` so an older npm refuses to install rather than doing it
> half-way.


## Server installation :
1. Dowload the zip file from GitHub.
2. Unzip the file on the installation folder of your choice
2. Move to the /server folder.
3. Execute npm install

	Note that *npm install*  will install automatically all project dependencies.


## Start the Server
  On the terminal of the OS, execute (one of the following)

	 * If using a remote database server, try something like
	  	MONGODB_URL="mongodb://readwrite:xxxx@ds021462.mlab.com:21462/kpax2" bin/www

			where
					xxxx is the database pwd
					readwrite  is the database user
					ds021462.mlab.com:21462/kpax2  the database of the remote server and  21462 is the connection port.

	* if using a local database:
		Either run
			npm start
			or
			/bin/www (directly from the  /server folder)


## Stop the Server:

	Ctrl + C  (on the terminal where the server is running)
