# Local instance of OpenRouteService 

The server is managed through a docker image. The corresponding YAML and ENV files are in
`~ilda/projects/ors`

Launching ORS docker image:

`sudo docker compose up -d`

See logs:

`sudo docker compose logs --follow`

The server runs on `http://129.175.5.5:8080` and is accessible from eduroam at `https://mapitin.lisn.upsaclay.fr:8890`

Checking the server's health: `https://mapitin.lisn.upsaclay.fr:8890/ors/v2/health`

Checking the server's status: `https://mapitin.lisn.upsaclay.fr:8890/ors/v2/status`

ORS git repo: `https://github.com/GIScience/openrouteservice`

Current version running locally: 8.0.1

# Local instance of Overpass

Build Overpass following install instructions at http://overpass-api.de/full_installation.html and https://wiki.openstreetmap.org/wiki/Overpass_API/Installation

Then edit `/etc/apache2/ports.conf` and change from `80` to `8082`

Edit `sites-enabled/000-default.conf`:

    <VirtualHost *:8082>
        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        ScriptAlias /api/ /home/ilda/projects/overpass/osm-3s_v0.7.62.2/cgi-bin/

        <Directory "/home/ilda/projects/overpass/osm-3s_v0.7.62.2/cgi-bin/">
                AllowOverride None
                Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
                Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
    </VirtualHost>


Restart Apache 2 server:
`sudo systemctl reload apache2`

The server runs on `http://129.175.5.5:8082` and is accessible from eduroam at `https://mapitin.lisn.upsaclay.fr:XXXX`

Checking the server's reachability:
`https://mapitin.lisn.upsaclay.fr:XXXX/api/interpreter`
