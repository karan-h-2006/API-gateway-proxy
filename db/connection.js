const { Client } = require('pg')
// const env = require('../config/env')

const client = new Client({ //configuration details of postgres server.
});// Create a new PostgreSQL client, takes in the configuration variables from the .env file by default.

module.exports = client;