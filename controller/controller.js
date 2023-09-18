const saltRounds = 10;
const bcrypt = require("bcrypt");
const knex = require("knex");
const knexConfig = require('../db/db');
const db = knex(knexConfig.development);


const registerUser = (req, res) => {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          console.log("loginEMail",loginEmail)
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0],
              name: name,
            })
            .then(user => {
              res.json(user[0])
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
      .catch(err => {
        console.log('err',err)
        res.status(400).json("Unable to register. Please try again")
      })
  }

  
  const signIn = (req, res) => {
    const { email, password } = req.body;
    db.select('email', 'hash').from('login')
      .where('email', '=', email)
      .then(data => {
        if (data.length === 0) {
          res.status(400).json('Wrong Credentials!')
        }
        else {
          const isValid = bcrypt.compareSync(password, data[0].hash);
          if (isValid) {
            return db.select('*').from('users')
              .where('email', '=', email)
              .then(user => {
                res.status(200).json(user[0])
              })
              .catch(err => "Unable to get user")
          }
          else {
            res.status(400).json('Wrong Credentials!')
          }
        }
      })
  }
  
  const getReport = (req, res) => {
    const email = req.params.email;
    db.select('*').from('reports')
      .where('email', '=', email)
      .then(data => res.json(data))
      .catch(console.log("Oops"))
  }
  
  const storeReport =  (req, res) => {
    const { subject, level, status, score, email } = req.body;
    db('reports')
      .returning('*')
      .insert({
        subject: subject,
        level: level,
        status: status,
        score: score,
        date: new Date(),
        email: email
      })
      .then(report => {
        res.json(report[0])
      })
      .catch(err => res.json("Could not save your report!"))
  }

  
module.exports={
    registerUser,
    signIn,
    getReport,
    storeReport,
}