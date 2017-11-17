"use strict"

var express = require('express');
var router = express.Router();
const cfenv = require('cfenv');
const sql = require('mssql');
const aes = require('crypto-js/aes');
const utf8 = require('crypto-js/enc-utf8');

const appEnv = cfenv.getAppEnv();
console.log(process.env.db_info);
let decrypt = aes.decrypt(process.env.db_info, 'thekey');
let dbConfig = JSON.parse(decrypt.toString(utf8));

//const dbConfig = appEnv.getServiceCreds('presstrack_db');

const config = {
    user: dbConfig.username,
    password: dbConfig.password,
    server: dbConfig.server, //3.156.32.235, either use IP or fully qualified name
    port: dbConfig.port,
    database: dbConfig.database,
    parseJSON: true, //test this
    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};

function getUsers(res, state) {
    //need to check if the connection is already opened.
    //received this error: Global connection already exists. Call sql.close() first.
    sql.connect(config).then(pool => {
            return pool.request()
                .input('state', sql.VarChar, state)
                .query('select top 10 contact_id,first_name,last_name,title,city from contact where state=@state')
        })
        .then(results => {
            sql.close();
            //console.log(results);
            //res.json(results);
            let grid = displayUsers(results.recordset); //might need to change, since adding parseJSON to the config
            res.send(grid);
        })
        .catch(err => {
            sql.close();
            console.log(err);
            res.send(err.message);
        });
}

function displayUsers(data) {

    let table = '<table>';
    let header = '<tr><th>Contact ID</th><th>First Name</th><th>Last Name</th><th>Title</th><th>City</th></tr>';
    let rows = '';

    for (let i = 0; i < data.length; i++) {
        let d = data[i];
        rows += `<tr>${makeCell(d.contact_id)}${makeCell(d.first_name)}${makeCell(d.last_name)}${makeCell(d.title)}${makeCell(d.city)}</tr>`;
    }

    table = table + header + rows + '</table>';

    return table;
}

function makeCell(data) {
    return `<td>${data}</td>`;
}
/* GET users listing. */
router.get('/', function(req, res, next) {
    getUsers(res, 'CA');
    //res.send('respond with a resource');
});

module.exports = router;