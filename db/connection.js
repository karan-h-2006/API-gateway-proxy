const { Client } = require('pg')
const dotenv = require('dotenv')
dotenv.config() // Load the environment variables from the .env file into the process.env object

const client = new Client({ //configuration details of postgres server.
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
});// Create a new PostgreSQL client, takes in the configuration variables from the .env file by default.

module.exports = client;