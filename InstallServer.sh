#!/bin/bash
#################################################
#
# Script to install and configure server
# Ubuntu 16.04 LTS / Kpax 2
#
# Felix Ortego
# Universitat Oberta de Catalunya (2017)
#
#################################################

# NPM
clear
echo "Install NPM & nodejs"
sudo aptitude install npm nodejs-legacy
read -rsp $'Press any key to continue...\n' -n1

# MongoDB
clear
echo "Install MongoDB"
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod start
read -rsp $'Press any key to continue...\n' -n1


# NPM modules
clear
echo "Install NPM Modules"
npm install express serve-favicon morgan cookie-parser body-parser debugging mongodb debug pug
read -rsp $'Press any key to continue...\n' -n1

# Execute server
clear
echo "Export variables"
echo "export MONGODB_URL=\"mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2\""
echo "export DEBUG=* MONGODB_URL=\"mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2\""
export MONGODB_URL="mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2"
export DEBUG=* MONGODB_URL="mongodb://readwrite:1234@ds021462.mlab.com:21462/kpax2"
echo ""
echo "Executar el server"
echo "npm start"
read -rsp $'Press any key to continue...\n' -n1 

exit 0
