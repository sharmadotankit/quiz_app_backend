const saltRounds = 10;
const bcrypt = require("bcrypt");
const knex = require("knex");
const knexConfig = require("../db/db");
const db = knex(knexConfig.development);
const jwt = require("jsonwebtoken");
const JET = process.env.JWT_SECRET;

const registerUser = async(req, res) => {
  try{
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, saltRounds);

    const userResponse = await db.select('*').from('users').where('email','=',email)
    if(userResponse.length>0){
      res.send({ status:false,data:null,message:"User already exists"});
      return;
    }


    db.transaction((trx) => {
      trx
        .insert({
          hash: hash,
          email: email,
        })
        .into("login")
        .returning("email")
        .then((loginEmail) => {
          return trx("users")
            .returning("*")
            .insert({
              email: loginEmail[0],
              name: name,
            })
            .then(async(user) => {
              let dataForToken = {
                id: user[0].id,
                email: user[0].email,
              };
          
              let jwtOptions = { expiresIn: '720h' }
              let authToken = jwt.sign(dataForToken,JET,jwtOptions);

              console.log('userData',dataForToken)
              console.log('authtoeken',authToken)

              await db("users").where("email", user[0].email).update({ token: authToken })
              
              const response = await db.select('*').from('user').where('email','=',user[0].email);
              console.log('response',response)

              res.json({status:true, data:response[0], message:"User registered successfully"});
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch((err) => {
      console.log("err", err);
      res.status(400).json({ status:false,data:null,message:"Unable to register"});
    });
  }catch(err){
    res.status(400).json({ status:false,data:null,message:err.message});
  }  
};

const signIn = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(401).json({
        status: false,
        statusCode: 401,
        message: "Invalid email and password provided",
      });
    }

    db.select("email", "hash")
      .from("login")
      .where("email", "=", email)
      .then((data) => {
        if (data.length === 0) {
          res.status(400).json("Wrong Credentials!");
        } else {
          const isValid = bcrypt.compareSync(password, data[0].hash);
          db.select("*")
            .from("users")
            .where("email", "=", email)
            .then((dataFromUser) => {
              if (dataFromUser.length > 0) {
                let dataForToken = {
                  id: dataFromUser[0].id,
                  email: dataFromUser[0].email,
                };
                let jwtOptions = { expiresIn: "720h" };
                let authToken = jwt.sign(dataForToken, JET, jwtOptions);
                if (isValid) {
                  db("users")
                    .where("email", dataFromUser[0].email) 
                    .update({ token: authToken })

                  return db
                    .select("*")
                    .from("users")
                    .where("email", "=", email)
                    .then((user) => {
                      res.status(200).json({status: true, data:user[0],message:"Signin successful"});
                    })
                    .catch((err) => res.status(400).json({status : false, data: null, message:"Unable to get user"}))
                } else {
                  res.status(400).json({status : false, data: null, message:"Wrong Credentials!"});
                }
              }
            });
        }
      });
  } catch (err) {
    res
      .status(500)
      .json({ status: false, data: null, message: "Something went wrong" });
  }
};

const getReport = (req, res) => {
  const email = req.params.email;
  db.select("*")
    .from("reports")
    .where("email", "=", email)
    .then((data) => res.json(data))
    .catch(console.log("Oops"));
};

const storeReport = (req, res) => {
  const { subject, level, status, score, email } = req.body;
  db("reports")
    .returning("*")
    .insert({
      subject: subject,
      level: level,
      status: status,
      score: score,
      date: new Date(),
      email: email,
    })
    .then((report) => {
      res.json(report[0]);
    })
    .catch((err) => res.json("Could not save your report!"));
};

module.exports = {
  registerUser,
  signIn,
  getReport,
  storeReport,
};
