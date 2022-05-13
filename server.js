import express from "express";
import knex from "knex";
import cors from 'cors';
import bcrypt from "bcrypt";

const app = express();
const saltRounds = 10;

app.use(cors());
app.use(express.json());

const db = knex({
  client: 'pg',
  connection: {
	  host : 'postgresql-rectangular-89547',
	  user : 'postgres',
	  password : 'postgres',
	  database : 'quizapp'
  }
});


app.get("/",(req,res)=>{ res.send('it is working')})

app.post("/register",(req,res)=>{
    const {name,email,password} =req.body;
    const hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx =>{
      trx.insert({
        hash:hash,
        email:email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email:loginEmail[0],
            name:name,
          })
          .then(user => {
            res.json(user[0])
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json("Unable to register. Please try again"))
})


app.post('/signin',(req,res)=>{
    const {email,password} = req.body;
    db.select('email','hash').from('login')
    .where('email','=',email)
    .then(data => {
      if(data.length===0){
        res.status(400).json('Wrong Credentials!')
      }
      else{
        const isValid = bcrypt.compareSync(password,data[0].hash);
        if(isValid){
          return db.select('*').from('users')
          .where('email','=',email)
          .then(user => {
            res.status(200).json(user[0])
          })
          .catch(err => "Unable to get user")
        }
        else{
          res.status(400).json('Wrong Credentials!')
        }
      }
    })
})


app.get("/report/:email", (req,res) => {
	const email = req.params.email;
  db.select('*').from('reports')
  .where('email','=',email)
  .then(data => res.json(data))
  .catch(console.log("Oops"))
})


app.post('/storereport',(req,res)=>{
    const {subject,level,status,score,email} = req.body;
    db('reports')
    .returning('*')
    .insert({
      subject:subject,
      level:level,
      status:status,
      score:score,
      date:new Date(),
      email:email
    })
    .then(report =>{
      res.json(report[0])
    })
    .catch(err => res.json("Could not save your report!"))
})

const PORT = process.env.PORT;


app.listen(PORT||3000 , ()=>{
  console.log(`App running in port ${PORT}`)
});
