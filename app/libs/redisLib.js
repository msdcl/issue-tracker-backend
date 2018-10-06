//redis lib
const check = require("./checkLib.js");
const redis = require('redis');
let client = redis.createClient();

client.on('connect', () => {

    console.log("Redis connection successfully opened");

});
// function to set new todo list in redis hash
let setTokenInHash = (hashName, key, value, callback) => {
   
    client.HMSET(hashName, [
        key, value
    ], (err, result) => {
        if (err) {
            console.log(err);
            callback(err, null)
        } else {

            console.log("set token in hash");
            console.log(result)
            callback(null, result)
        }
    });


}

// fucntion to get all todo list in redis hash
// let getTodoListFromHash = (hashName, callback) => {
    

//     client.HGETALL(hashName, (err, result) => {
        

//         if (err) {

//             console.log(err);
//             callback(err, null)

//         } else if (check.isEmpty(result)) {

//             console.log("todo list is empty");
//             console.log(result)

//             callback(null, {})

//         } else {
//             console.log("get all data from redis hash")
//             console.log(result);
//             callback(null, result)

//         }
//     });

// }
// function to delete a todo list from redis
let deleteTokenInHash = (hashName, key, callback) => {
       
    client.HDEL(hashName, key, (err, result) => {
        if (err) {
            console.log(err);
            callback(err, null)
        } else {

            console.log("delete token from hash");
            console.log(result)
            callback(null, result)
        }
    });


}

let getTokenInHash = (hashName, key, callback) => {
       
    client.HGET(hashName, key, (err, result) => {
        if (err) {
            console.log(err);
            callback(err, null)
        } else {

            console.log("get token from hash");
            console.log(result)
            callback(null, result)
        }
    });


}







module.exports = {
    setTokenInHash:setTokenInHash,
    deleteTokenInHash:deleteTokenInHash,
    getTokenInHash:getTokenInHash
}

