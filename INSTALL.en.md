# INSTALL

To install the server simply follow this instructions

## Previous

The system in which the server will be installed, must have the following components working properly:

1. NodeJs v16.14.0 or higher
2. npm (Node Package Manager) v8.3.0 or higher
3. MongoDB Server (mongod v.2.6.10 or hihger, only if you want to work on a local database)

> **Why npm 8.3.0 and not the 3.8.6 this used to say.** The `qs` security fix
> is applied through the `overrides` field in `package.json`, and npm only
> honours that field from 8.3.0 on. On an older npm it is ignored *silently*:
> express and body-parser resolve `qs` from their own `~6.15.1` range, the
> install reports success, and the two advisories the override exists to close
> are still present. npm 3 also predates `package-lock.json` entirely, so the
> pinned tree in this repository would be ignored too. Node 16.14.0 is simply
> the first release that ships an npm new enough; `engine-strict` is set, so an
> npm that cannot apply the fix refuses to install rather than producing a tree
> that only looks patched.


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
