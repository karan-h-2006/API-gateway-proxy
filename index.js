const express = require('express')
const client = require('./db/connection.js')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

//First connect to postgre sql server, if successful then start the backend server, else shut down.
client.connect().then(() => {
    console.log('Connected to PostgreSQL')
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Error connecting to PostgreSQL', err);
})


