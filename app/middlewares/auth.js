
/* Const Library */
const logger = require('./../libs/loggerLib')
const response = require('./../libs/responseLib')
const check = require('./../libs/checkLib')
const redis = require('./../libs/redisLib')


let isAuthenticated = (req, res, next) => {
  if (req.params.authToken || req.query.authToken || req.header('authToken')) {
    if(req.params.authToken=="Admin" || req.query.authToken=="Admin" || req.header('authToken')=="Admin"){
      req.user = {fullName:'Admin',userId:'Admin'}
      next();
    }
    else{
      logger.error('Incorrect authentication token', 'Authentication Middleware', 5)
      let apiResponse = response.generate(true, 'Incorrect authentication token', 403, null)
      res.send(apiResponse)
    }
  } else {
    logger.error('Authentication Token Missing', 'Authentication Middleware', 5)
    let apiResponse = response.generate(true, 'Authentication Token Is Missing In Request', 403, null)
    res.send(apiResponse)
  }
}


let authenticateUser = (req, res, next) => {
  if (req.params.authToken || req.query.authToken || req.header('authToken')) {

    UserModel.findOne({ userId: req.body.userId }, (err, userDetails) => {
      if (err) {
          console.log(err)
          logger.error('Failed To Retrieve User Data', 'auth: authenticateUser()', 10)
          let apiResponse = response.generate(true, 'Failed To Find User Details', 403, null)
          res.send(apiResponse)
      } else if (check.isEmpty(userDetails)) {
          logger.error('No User Found', 'auth: authenticateUser()', 7)
          let apiResponse = response.generate(true, 'this email does not exist!', 403, null)
          res.send(apiResponse)
      } else {
        
    if(req.params.authToken==userDetails.token || req.query.authToken==userDetails.token || req.header('authToken')==userDetails.token){
      next();
    }
    else{
      logger.error('Incorrect authentication token', 'Authentication Middleware', 5)
      let apiResponse = response.generate(true, 'Incorrect authentication token', 403, null)
      res.send(apiResponse)
    }
      }
  });

  } else {
    logger.error('Authentication Token Missing', 'Authentication Middleware', 5)
    let apiResponse = response.generate(true, 'Authentication Token Is Missing In Request', 403, null)
    res.send(apiResponse)
  }
}

let authenticateUserWithHash = (req,res,next)=>{
  if (req.params.authToken || req.query.authToken || req.header('authToken')) {

     redis.getTokenInHash("userToken",req.header('authToken'),(err,result)=>{
       if(check.isEmpty(result)){
        logger.error('user is not login', 'Authentication Middleware', 5)
        let apiResponse = response.generate(true, 'token does not exist', 403, null)
        res.send(apiResponse)
       }else{
       
          next();
        
        // else{
        //   logger.error('Incorrect authentication token', 'Authentication Middleware', 5)
        //   let apiResponse = response.generate(true, 'Incorrect authentication token', 403, null)
        //   res.send(apiResponse)
        // }
       }
     })
  } else {
    logger.error('Authentication Token Missing', 'Authentication Middleware', 5)
    let apiResponse = response.generate(true, 'Authentication Token Is Missing In Request', 403, null)
    res.send(apiResponse)
  }
}

module.exports = {
  isAuthenticated: isAuthenticated,
  authenticateUser:authenticateUser,
  authenticateUserWithHash:authenticateUserWithHash
}
