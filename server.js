//* MNT
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const search = require('./searchEngine.js');

//* VAR
const port = process.env.PORT || 3000;
const SWAPI_URL = 'https://swapi.info/api'
let starshipsCache = [];

//* APP
const app = express();

//* MID
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    'Content-Type': 'application/x-www-form-urlencoded'
}))

//* ROUTE
app.get('/', cors(), (req,res) => {
    res.status(200).send(
        `<main>
            <h1>Searh Engine</h1>
            <form action="http://localhost:${port}/search" method="POST">
                <input name="q" type="search">
                <button type="submit">🔎</button>
                <br>
                <label for="block">Block </label>
                <input id="block" name="block">
                <br>
                <label for="returnType">Return Type </label>
                <input id="returnType" name="returnType">

            </form>
            <br>
            <h3>Or Make a POST request to /search:</h3>
            <p>search(term, data, options)</p>
        </main>`
    );
})

app.get('/starships', async (req,res) => {
    try {
        if (starshipsCache.length===0) await updateCache();
        if (starshipsCache.length===0) throw new Error("Failed to load cache.");
        res.status(200).json(starshipsCache);
    } catch (err) {
        console.error(err)
    }
})

app.post('/search', async (req,res) => {
    try {
        if (starshipsCache.length===0) await updateCache();
        if (starshipsCache.length===0) throw new Error("Failed to load cache.");
        let result = search((req.body.q || req.query.q), starships, req.body?.options || {block:1});
        if (result.length===0) result = search((req.body.q || req.query.q), starships, {...req.body?.options, block:2});
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({error:err.message})
    }
})

//* LISTEN
app.listen(port, ()=>console.log(`Server Running on Port ${port}. Access at`, [`http://localhost:${port}`]));

//* FUNC
async function updateCache() {
    try {
        const response = await fetch(SWAPI_URL+'/starships');
        if (!response) throw new Error("Failed to load cache.", response);
        starshipsCache = await response.json();
        return true;
    } catch (err) {
        return err.message
    }
}
async function updateCachePRO() {
    try {
        const response = await fetch(process.env.SWAPI_URL+'/starships');
        if (!response) throw new Error("Failed to load cache.");
        const data = await response.json();
        for (let datum of data) {
            for (let key of ['pilots', 'films']) {
                if (datum[key].length > 0) {
                    for (let [link,idx] of datum[key]) {
                        const res = await fetch(link);
                        datum[key].splice(idx, 1, {...res.json(), url:link});
                    }
                }
            }
        }
        return true;
    } catch (err) {
        return err.message
    }
}