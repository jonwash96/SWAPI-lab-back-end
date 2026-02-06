require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// VAR
const port = process.env.PORT || 3000;


// APP
const app = express();

// MID
app.use(morgan('dev'));
app.use(cors());

// ROUTE
app.get('/', (req,res) => {
    res.status(200).send("Hello, World!");
})

app.get('/search', async (req,res) => {
    const response = await fetch(`${process.env.WEATHERAPI_URL}${process.env.WEATHERAPI_KEY}`+'&q='+req.query.city+'&aqi=no');
    const data = await response.json()
    console.log(data)
    res.json(data)
})

// LISTEN
app.listen(port, ()=>console.log(`Server Running on Port ${port}. Access at`, [`http://localhost:${port}`]));