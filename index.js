const env = require('./config/env.js')
const express = require('express')
const client = require('./db/connection.js')

const app = express()

//First connect to postgre sql server, if successful then start the backend server, else shut down.
client.connect().then(() => {
    console.log('Connected to PostgreSQL')
    app.listen(env.PORT, () => {
        console.log(`Server is running on port ${env.PORT}`);
    });
}).catch((err) => {
    console.error('Error connecting to PostgreSQL', err);
})


