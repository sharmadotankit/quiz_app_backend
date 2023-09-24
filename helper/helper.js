const jwt = require('jsonwebtoken');
const OtpModel = require('../Models/Otp');

let helper = {
    getTokenData: function(data){
        try {
            let header = data.headers.authorization;
            if(!header){
                throw({
                    message: req.app.get('strings').MESSAGE_AUTH_HEADER_REQUIRED
                })
            }
            else{
                let splitTokn = header.split(' ');
                let token = splitTokn[1];
                
                if (!token) throw({
                    message: req.app.get('strings').MESSAGE_AUTH_HEADER_REQUIRED
                })

                let tokenData = jwt.verify(token, process.env.JWT_SECRET);
                return tokenData;
            }
        } catch (error) {
            console.log("error",error)
            return false;
        }
    },

    checkIfUser:function(req,res,next){
        try {
            let header = req.headers.authorization;
            if(!header){
                throw({
                    message: "Authorization header is required"
                })
            }
            else{
                let splitTokn = header.split(' ');
                let token = splitTokn[1];
                if (!token) throw({
                    message: "Authorization header is required"
                })
                let userData = jwt.verify(token, process.env.JWT_SECRET);
                if(!userData){
                    res.status(401);
                    return res.send("Unauthorized user")
                }      
               next();
            }
        } catch (error) {
            console.log("error",error)
            res.status(401);
            return res.send("Unauthorized user")
        }
    },
}

module.exports = helper;