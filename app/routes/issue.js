const express = require('express');
const router = express.Router();
const issueController = require("./../../app/controllers/issue");
const notiController = require("./../../app/controllers/notification");
const appConfig = require("./../../config/config")
const auth = require("./../../app/middlewares/auth");


const multer = require('multer');

// const upload = multer({dest:'uploads/'})
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null,file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

module.exports.setRouter = (app) => {

    let baseUrl = appConfig.apiVersion;


    app.post(`${baseUrl}/reportIssue` ,auth.authenticateUserWithHash,upload.single('attachment'),issueController.reportIssue);
   
     app.post(`${baseUrl}/assignedIssuesToUser`,auth.authenticateUserWithHash, issueController.getAllAssignedIssues);

     app.post(`${baseUrl}/getIssueDetails`,auth.authenticateUserWithHash, issueController.getIssueById);

     app.post(`${baseUrl}/followIssue`,auth.authenticateUserWithHash, issueController.watchIssue);

     app.post(`${baseUrl}/unfollowIssue`,auth.authenticateUserWithHash, issueController.unfollowIssue);

     app.post(`${baseUrl}/allCommentsForIssue`,auth.authenticateUserWithHash, notiController.getAllCommentForIssue);

     app.post(`${baseUrl}/addCommentsToIssue`,auth.authenticateUserWithHash, notiController.addComment);

     app.post(`${baseUrl}/updateIssue`,auth.authenticateUserWithHash,upload.single('attachment'), issueController.updateIssue);

     app.post(`${baseUrl}/searchIssue`,auth.authenticateUserWithHash, issueController.searchByText);

     app.post(`${baseUrl}/getAllNotifications`,auth.authenticateUserWithHash, notiController.getAllNotificationsOfUser);

     app.post(`${baseUrl}/markNotificationSeen`,auth.authenticateUserWithHash, notiController.markNotificationsAsSeen);
    
    // app.post(`${baseUrl}/logout`, userController.logout);

    // app.post(`${baseUrl}/forgotPassword`, userController.forgotPassword);

    // app.post(`${baseUrl}/changePassword`, userController.changePassword);
    
    // app.get(`${baseUrl}/allUsers`, userController.getAllUsers);
}
