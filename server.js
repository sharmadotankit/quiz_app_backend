const express =require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
const controller = require('./controller/controller');


app.post("/register", controller.registerUser)
app.post('/signin', controller.signIn)
app.get("/report/:email", controller.getReport)
app.post('/storereport',controller.storeReport)


app.listen(4001, () => console.log("app running in port 4001"));
