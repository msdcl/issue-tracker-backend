const mongoose = require('mongoose');
const shortid = require('shortid');
const response = require('./../libs/responseLib')
const time = require('./../libs/timeLib');

const logger = require('./../libs/loggerLib');
const sock_session = require('../libs/activeSockets')
//model
const NotificationModel = mongoose.model('Notification')
const CommentModel = mongoose.model('Comment')

let markNotificationsAsSeen = (req, res) => {

    let update = req.body
    NotificationModel.update({ 'userId': req.body.userId }, update, { multi: true }).exec((err, result) => {

        if (err) {
            console.log(err)
            let apiResponse = response.generate(true, ' notification mark as seen failed', 400, err)
            res.send(apiResponse)
        } else {
            //  console.log(result)
            let apiResponse = response.generate(false, 'notification seen', 200, result)
            res.send(apiResponse)

        }
    })
}


let getAllNotificationsOfUser = (req, res) => {
    NotificationModel.find({ 'userId': req.body.userId },null,{sort: {date: 1}}, (err, result) => {

        if (err) {
            console.log(err)
            let apiResponse = response.generate(true, 'error in getting notifications', 400, err)
            res.send(apiResponse)
        } else {
            // console.log(result)
            let apiResponse = response.generate(false, 'All notifications', 200, result)
            res.send(apiResponse)
        }
    })
}

let addComment = (req, res) => {
    let add = (req, res) => {
        return new Promise((resolve, reject) => {
            let newComment = new CommentModel({
                id: shortid.generate(),
                issueId: req.body.issueId,
                text: req.body.text,
                by: req.body.name,
                date: req.body.time
            })

            newComment.save((err, newComment) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'addComment', 10)
                    let apiResponse = response.generate(true, 'Failed to add comment', 500, null)
                    reject(apiResponse)
                } else {
                    let watcher;
                    if(req.body.watcher.length >0){
                       watcher = JSON.parse(req.body.watcher);
                    }else{
                        watcher=[];
                    }
                    for (let x in watcher) {
                        let newNotifi = new NotificationModel({
                            id: shortid.generate(),
                            userId: watcher[x].id,
                            isSeen: false,
                            text: `Someone commented on issue ${req.body.issueName}`,
                            issueId: req.body.issueId,
                            date: req.body.time
                        })

                        newNotifi.save((err, newNotification) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'setNewNotification', 10)
                                let apiResponse = response.generate(true, 'Failed to add new notification', 500, null)
                                reject(apiResponse)
                            } else {

                                if (sock_session.sessions[watcher[x].id] != undefined && watcher[x].id !=req.body.userId) {
                                    let data = {
                                        comment: newComment,
                                        notification: newNotification
                                    }
                                    sock_session.sessions[watcher[x].id].emit("New-Notification-Comment", data);
                                }

                            }
                        })
                    }
                    resolve(newComment)
                }
            })
        })
    }

    add(req, res)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue updated', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}

let getAllCommentForIssue = (req,res)=>{
    CommentModel.find({ 'issueId': req.body.issueId },null,{sort: {date: 1}}, (err, result) => {

        if (err) {
            console.log(err)
            let apiResponse = response.generate(true, 'error in getting comments', 400, err)
            res.send(apiResponse)
        } else {
            // console.log(result)
            let apiResponse = response.generate(false, 'All comments', 200, result)
            res.send(apiResponse)
        }
    })
}
module.exports = {
    markNotificationsAsSeen: markNotificationsAsSeen,
    getAllNotificationsOfUser: getAllNotificationsOfUser,
    addComment:addComment,
    getAllCommentForIssue:getAllCommentForIssue
}