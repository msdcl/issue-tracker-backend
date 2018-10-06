const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')

const token = require('../libs/tokenLib')
const redis = require('../libs/redisLib')

const sock_session = require('../libs/activeSockets')
//model
const IssueModel = mongoose.model('Issue')
const NotificationModel = mongoose.model('Notification')



let reportIssue = (req, res) => {

    let decodeToken = (req, res) => {
        return new Promise((resolve, reject) => {
            token.verifyToken(req.header('authToken'), (err, result) => {
                if (err) {
                    let apiResponse = response.generate(true, 'invalid token', 400, null)
                    res.send(apiResponse)
                } else {
                    resolve(result);
                }
            })
        })
    }

    let createIssue = (userDetails) => {
        return new Promise((resolve, reject) => {
            console.log(req.file)
            let temp = ""
            if (req.file != undefined) {
                temp = req.file.path;
            }
            let newId = shortid.generate();
            let newIssue = new IssueModel({
                id: newId,
                title: req.body.title,
                reporter: userDetails.data.userName,
                reporterId: userDetails.data.userId,
                status: req.body.status,
                assignee: req.body.assignee,
                description: req.body.description,
                createdOn: req.body.time,
                watch: JSON.parse(req.body.watch),
                attachments: temp
            })

            newIssue.save((err, newIssue) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'reportIssue: createIssue', 10)
                    let apiResponse = response.generate(true, 'Failed to add new issue', 500, null)
                    reject(apiResponse)
                } else {
                    resolve(newIssue)
                }
            })
        })
    }

    let setNewNotification = (data) => {
        return new Promise((resolve, reject) => {
            let newNotifi = new NotificationModel({
                id: shortid.generate(),
                userId: data.assignee,
                isSeen: false,
                text: `New task is assigned to you by ${data.reporter}`,
                issueId: data.id,
                date: data.createdOn
            })

            newNotifi.save((err, newNotification) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'setNewNotification', 10)
                    let apiResponse = response.generate(true, 'Failed to add new notification', 500, null)
                    reject(apiResponse)
                } else {

                    if (sock_session.sessions[data.assignee] != undefined) {
                        let result = {
                            notification: newNotification,
                            data: data
                        }
                        sock_session.sessions[data.assignee].emit("New-Notification-New-isuue", result);
                    }
                    resolve(data)
                }
            })
        })

    }

    decodeToken(req, res)
        .then(createIssue)
        .then(setNewNotification)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'issue created', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

let getAllAssignedIssues = (req, res) => {
    let getIssues = (req, res) => {
        return new Promise((resolve, reject) => {
            IssueModel.find({ 'assignee': req.body.userId }, null, { sort: { createdOn: -1 } }, (err, result) => {

                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'error in getting assigned issues', 400, err)
                    reject(apiResponse)
                } else {
                    //console.log(result)
                    resolve(result)
                    // let apiResponse = response.generate(false, 'All assigned issues', 200, result)
                    // res.send(apiResponse)
                }
            })
        })
    }

    getIssues(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'All assigned issues', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

let updateIssue = (req, res) => {

    let decodeToken = (req, res) => {
        return new Promise((resolve, reject) => {
            token.verifyToken(req.header('authToken'), (err, token) => {
                if (err) {
                    let apiResponse = response.generate(true, 'invalid token', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(token);
                }
            })
        })
    }

    let update = (token) => {
        return new Promise((resolve, reject) => {
            let update = req.body;
            IssueModel.findOneAndUpdate({ 'id': req.body.id }, update, { new: true }, (err, result) => {

                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, ' issue updation failed', 400, err)
                    reject(apiResponse)
                } else {
                    //   console.log(result)
                    
                    console.log(req.file)
                    if (req.file != undefined) {
                        IssueModel.findOneAndUpdate({ 'id': req.body.id }, { $set: { attachments: req.file.path } }, { new: true }, (err, result) => {

                            if (err) {
                                console.log(err)
                                let apiResponse = response.generate(true, ' issue updation failed-2', 400, err)
                                reject(apiResponse)
                            } else {
                                console.log(result)
                              let  data = {
                                    token: token,
                                    updated: result
                                }
                                resolve(data)
                            }
                        })
                    } else {
                      let  data = {
                            token: token,
                            updated: result
                        }
                        resolve(data)
                    }

                   
                    // let apiResponse = response.generate(false, 'issue updated', 200, result)
                    // res.send(apiResponse)

                }
            })
        })
    }

    let setNewNotification = (data) => {
        return new Promise((resolve, reject) => {
            let watcher = data.updated.watch;
            console.log(watcher)
            for (let x in watcher) {
                let newNotifi = new NotificationModel({
                    id: shortid.generate(),
                    userId: watcher[x].id,
                    isSeen: false,
                    text: `There is a update on issue ${data.updated.title} by ${data.token.data.userName}`,
                    issueId: data.updated.id,
                    date: time.getEpoch()
                })

                newNotifi.save((err, newNotification) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'setNewNotification', 10)
                        let apiResponse = response.generate(true, 'Failed to add new notification', 500, null)
                        reject(apiResponse)
                    } else {
                        // let watcher = data.updated.watch;
                        // for(let x in watcher){

                        if (sock_session.sessions[watcher[x].id] != undefined) {
                            let dat = {
                                notification: newNotification,
                                updated: data.updated
                            }

                            sock_session.sessions[watcher[x].id].emit("New-Notification-update", dat);
                        }
                        // }

                    }
                })
            }
            resolve(data.updated)
        })

    }
    decodeToken(req, res)
        .then(update)
        .then(setNewNotification)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue updated', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

let watchIssue = (req, res) => {


    let watch = (req, res) => {
        return new Promise((resolve, reject) => {

            IssueModel.findOne({ id: req.body.id, 'watch.id': req.body.watcherId }, (err, userDetails) => {
                if (err) {
                    console.log(err)
                    logger.error('Failed To Retrieve User Data', 'multiTaskList Controller: shareToDoListWithFriend()', 10)
                    let apiResponse = response.generate(true, 'Failed To Find shred User Details', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(userDetails)) {

                    IssueModel.findOneAndUpdate({ id: req.body.id }, { $push: { watch: { 'id': req.body.watcherId, 'name': req.body.watcherName } } }, (err, result) => {
                        if (err) {
                            console.log(err)
                            let apiResponse = response.generate(true, 'error in following issue', 400, err)
                            reject(apiResponse)
                        } else {
                            resolve(result);
                        }
                    })
                } else {
                    let apiResponse = response.generate(true, 'Already following', 500, null)
                    reject(apiResponse)
                }
            })
        })
    }

    watch(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue followed', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

// let allWatcherToIssue = (req, res) => {
//     let getList = (req, res) => {
//         return new Promise((resolve, reject) => {
//             IssueModel.find({ 'id': req.body.id }, (err, result) => {

//                 if (err) {
//                     console.log(err)
//                     let apiResponse = response.generate(true, 'error in getting watchers of issues', 400, err)
//                     reject(apiResponse)
//                 } else {
//                     //console.log(result)
//                     resolve(result)
//                     // let apiResponse = response.generate(false, 'All assigned issues', 200, result)
//                     // res.send(apiResponse)
//                 }
//             })
//         })
//     }

//     getList(req, res)
//         .then((resolve) => {
//             let apiResponse = response.generate(false, 'All watchers to issue', 200, resolve)
//             res.send(apiResponse)
//         })
//         .catch((err) => {
//             console.log(err);
//             res.send(err);
//         })
// }

let searchByText = (req, res) => {
    let search = (req, res) => {
        return new Promise((resolve, reject) => {
            let query = { $or: [{ title: { $regex: req.body.text, $options: 'i' } }, { reporter: { $regex: req.body.text, $options: 'i' } }, { status: { $regex: req.body.text, $options: 'i' } }] }

            IssueModel.find(query, null, { sort: { createdOn: -1 } }, (err, result) => {

                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'error in getting issues related to text', 400, err)
                    reject(apiResponse)
                } else {
                    //console.log(result)
                    resolve(result)
                    // let apiResponse = response.generate(false, 'All assigned issues', 200, result)
                    // res.send(apiResponse)
                }
            })
        })
    }
    search(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'All issues related to text', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}
//this function is used to get all details for an issue or also used to get watcher list
let getIssueById = (req, res) => {
    let getIssue = (req, res) => {
        return new Promise((resolve, reject) => {
            IssueModel.find({ 'id': req.body.id }, (err, result) => {

                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'error in getting issues details', 400, err)
                    reject(apiResponse)
                } else {
                    //console.log(result)
                    resolve(result)
                    // let apiResponse = response.generate(false, 'All assigned issues', 200, result)
                    // res.send(apiResponse)
                }
            })
        })
    }

    getIssue(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue details', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

let unfollowIssue = () => {
    IssueModel.update({ id: req.body.issueId }, { $pull: { 'watch.id': req.body.userId } }, { safe: true, upsert: true }).exec((err, result) => {
        if (err) {
            console.log(err)
            let apiResponse = response.generate(true, 'error to unfollow issue', 400, err)
            res.send(apiResponse)
        } else {
            console.log(result)
            let apiResponse = response.generate(false, 'issue unfollowed', 200, result)
            res.send(apiResponse)
        }
    })
}
module.exports = {
    reportIssue: reportIssue,
    getAllAssignedIssues: getAllAssignedIssues,
    updateIssue: updateIssue,
    watchIssue: watchIssue,
    searchByText: searchByText,
    getIssueById: getIssueById,
    unfollowIssue: unfollowIssue
}