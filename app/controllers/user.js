const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const passwordLib = require('./../libs/generatePasswordLib');
const token = require('../libs/tokenLib')
const redis = require('../libs/redisLib')
const sendEmail = require('../libs/sendEmails')
/* Models */
const UserModel = mongoose.model('User')
const ForgotPasswordModel = mongoose.model('ForgotPassword')


// start user signup function 

let signUpFunction = (req, res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not meet the requirement', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(req)
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        })
    }// end validate user input


    let createUser = () => {
        return new Promise((resolve, reject) => {

            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            userName: req.body.userName,
                            email: req.body.email,
                            mobileNumber: req.body.mobileNumber,
                            password: passwordLib.hashpassword(req.body.password),
                            createdOn: time.now(),
                        
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function


    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            delete resolve.password
            let apiResponse = response.generate(false, 'User created', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })


}// end user signup function 

// start of login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        console.log("findUser");
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req body email is there");
                console.log(req.body);
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    if (err) {
                        console.log(err)
                        logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(userDetails)) {
                        logger.error('No User Found', 'userController: findUser()', 7)
                        let apiResponse = response.generate(true, 'this email does not exist!', 401, null)
                        reject(apiResponse)
                    } else {
                        logger.info('User Found', 'userController: findUser()', 10)
                        resolve(userDetails)
                    }
                });

            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        console.log("validatePassword");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Login Failed', 500, null)
                    reject(apiResponse)
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    delete retrievedUserDetailsObj.tokens
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null)
                    reject(apiResponse)
                }
            })
        })
    }

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }

    let updateUserToken=(tokenDetails)=>{
      return new Promise((resolve,reject)=>{
        UserModel.findOneAndUpdate({userId: tokenDetails.userId }, {$push: {tokens: tokenDetails.token}}, (err, result) => {
            if (err) {
                console.log(err)
                let apiResponse = response.generate(true, 'error in updating token list', 400, err)
                reject(apiResponse)
            }else {
            
              resolve(tokenDetails);
            }
        })
      })
    }

// set user token in redis hash map

 let setTokenInRedisMap = (tokenDetails)=>{
     return new Promise((resolve,reject)=>{
         redis.setTokenInHash("userToken",tokenDetails.token,tokenDetails.userId,(err,result)=>{
             if(err){
                logger.error('err in set token to redis map', 'userController: setTokenInRedisMap', 7)
                let apiResponse = response.generate(true, 'error in token set- redis map', 401, null)
                reject(apiResponse)
             }else {
                resolve(tokenDetails);
            }
         })
     })
 }
    findUser(req, res)
        .then(validatePassword)
        .then(generateToken)
        .then(updateUserToken)
        .then(setTokenInRedisMap)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200); 
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            //  res.status(err.status)
            res.send(err)
        })
}


// end of the login function 


let logout = (req, res) => {
   redis.deleteTokenInHash("userToken",req.header('authToken'),(err,result)=>{
       if(err){
        logger.error('Failed logout user', 'userController: logout', 10)
        let apiResponse = response.generate(true, 'Failed To logout', 500, null)
        res.send(apiResponse)  
       }else{
        let apiResponse = response.generate(false, 'logout successful', 200, result)
        res.send(apiResponse)  
       }
   })
} // end of the logout function.

let forgotPassword = (req, res) => {

        let verifyUser = (req,res) => {
            return new Promise((resolve,reject)=>{
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    if (err) {
                        console.log(err)
                        logger.error('Failed To Retrieve User Data', 'userController: forgotPassword', 10)
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(userDetails)) {
                        logger.error('No User Found', 'userController: forgotPassword', 7)
                        let apiResponse = response.generate(true, 'this user email does not exist!', 401, null)
                        reject(apiResponse)
                    } else {
                        resolve(userDetails)
                    }
                });
            })
            
        }

       let generateSecureCode = ()=>{
           return new Promise((resolve,reject)=>{
            let secureCode = shortid.generate()

            ForgotPasswordModel.findOne({ email: req.body.email }, (err, userDetails2) => {
                if (err) {
                    console.log(err)
                    logger.error('Failed To Retrieve User Data', 'userController: forgotPassword', 10)
                    let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(userDetails2)) {
                    let newUser = new ForgotPasswordModel({
                        id: shortid.generate(),
                        email: req.body.email,
                        code: secureCode
                    })
                    newUser.save((err, newUser) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: forgotPassword', 10)
                            let apiResponse = response.generate(true, 'Failed to create secure code', 500, null)
                            reject(apiResponse)
                        } else {
                            console.log(newUser)
                            let newUserObj = newUser.toObject();
                            delete newUserObj.code;
                            console.log(newUserObj)
                            sendEmail.sendForgotPasswordEmail(req.body.email, secureCode);
                           resolve(newUserObj)
                        }
                    })
                }else{
                    ForgotPasswordModel.update({ email: req.body.email }, { $set: { code: secureCode } }, { upsert: true }, (err, result) => {
                        if (err) {
                            logger.error('change password', 'userController: forgotPassword', 7)
                            let apiResponse = response.generate(true, 'error in updating secure code', 401, null)
                            reject(apiResponse)
                        } else {
                            
                            sendEmail.sendForgotPasswordEmail(req.body.email, secureCode);
                            resolve(result)
                        }
                    })
                }
            });
           })
        

       
       } 

     verifyUser(req,res)
         .then(generateSecureCode)
         .then((resolve) => {
            let apiResponse = response.generate(false, 'We have send an email.', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            //  res.status(err.status)
            res.send(err)
        })





}

let changePassword = (req, res) => {


    ForgotPasswordModel.findOne({ email: req.body.email }, (err, userDetails) => {
        if (err) {
            console.log(err)
            logger.error('Failed To Retrieve User Data', 'userController: changePassword', 10)
            let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(userDetails)) {
            logger.error('change password', 'userController: changePassword', 7)
            let apiResponse = response.generate(true, 'this user email does not exist!', 401, null)
            res.send(apiResponse)
        } else {
            if (userDetails.code == req.body.code) {
                UserModel.update({ email: req.body.email }, { $set: { password: passwordLib.hashpassword(req.body.password) } }, { upsert: true }, (err, result) => {
                    if (err) {
                        logger.error('change password', 'userController: changePassword', 7)
                        let apiResponse = response.generate(true, 'error in updating passowrd', 401, null)
                        res.send(apiResponse)
                    } else {
                        ForgotPasswordModel.remove({ 'email': req.body.email}, (err, result1) => {
                            if (err) {
                                console.log(err)
                                let apiResponse = response.generate(true, 'error in deleting entry from forgot passoward', 400, err)
                                res.send(apiResponse)
                            }
                        })
                        console.log(result)
                        let apiResponse = response.generate(false, 'Password has been changed', 200, result)
                        res.send(apiResponse)
                    }
                })
            } else {
                logger.error('No User Found', 'userController: changePassword', 7)
                let apiResponse = response.generate(true, 'Invalid code', 401, null)
                res.send(apiResponse)
            }
        }
    });


}

let getAllUsers = (req,res)=>{
    UserModel.find()
    .select('-_id -__v -email -password -createdOn -mobileNumber')
    .sort('-createdOn')
    .skip(parseInt(req.query.skip) || 0)
    .lean()
    .exec((err, result) => {
      if (err) {
          console.log("hello hello")
        console.log(err)
        logger.error(err.message, 'allUser Controller: getlistOfAllUsers', 10)
        let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
        res.send(apiResponse)
      } else {
        console.log('users found on platform')

        let apiResponse = response.generate(false,'All users' , 200, result)
        res.send(apiResponse)

      }
    })
}
module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,
    forgotPassword: forgotPassword,
    changePassword: changePassword,
    getAllUsers:getAllUsers

}// end exports