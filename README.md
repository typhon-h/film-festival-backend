# Film Festival API

Backend API for a Film Festival website built from an API spec available at `src/app/resources/api_spec.yaml`

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages.
2. Create a file called `.env`, following the instructions in the section below.
3. Run `npm run start` or `npm run debug` to start the server.
4. The server will be accessible on `localhost:4941`.

### `.env` file

Create a `.env` file in the root directory of this project including the following information (note that you will need
to create the database first in an instance of phpMyAdmin):

```
MYSQL_HOST={url that hosts your phpMyAdmin instance}
MYSQL_USER={your username}
MYSQL_PASSWORD={your password}
MYSQL_DATABASE={a database starting with your usercode then an underscore}
```
