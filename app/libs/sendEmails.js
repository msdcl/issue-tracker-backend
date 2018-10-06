const nodemailer = require('nodemailer');

// Generate SMTP service account from ethereal.email

let sendForgotPasswordEmail = (toEmail,code)=>{
    let transporter = nodemailer.createTransport({
           service:'gmail',
          auth: {
              user: 'msc1994dc@gmail.com',
              pass: 'msc11dc15'
          }
      });
  
      // Message object
      let message = {
          from: 'msc1994dc@gmail.com',
          to: `${toEmail}`,
          subject: 'Forgot password',
          text: `Hi your secure code is - ${code}`,
  
      };
  
      transporter.sendMail(message, (err, info) => {
          if (err) {
              console.log('Error occurred. ' + err.message);
              return process.exit(1);
          }
  
        //   console.log('Email sent: %s', info.messageId);
        //   // Preview only available when sending through an Ethereal account
        //   console.log('Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
}

let meetingCreationEmail = (data,toEmail,cb)=>{
    let transporter = nodemailer.createTransport({
        service:'gmail',
       auth: {
           user: 'msc1994dc@gmail.com',
           pass: 'msc11dc15'
       }
   });

   // Message object
   let message = {
       from: 'msc1994dc@gmail.com',
       to: `${toEmail}`,
       subject: 'New meeting created',
       text: `Hi, new meeting is created by admin. See below details \n ${data}`,

   };

   transporter.sendMail(message, (err, info) => {
       if (err) {
           console.log('Error occurred. ' + err.message);
           cb(err,null)
        //   return process.exit(1);
       }
       
    //    console.log('Email sent: %s', info.messageId);
    //    // Preview only available when sending through an Ethereal account
    //    console.log('Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
       cb(null,info)
   });
}


let meetingUpdatedEmail = (data,toEmail,cb)=>{
    let transporter = nodemailer.createTransport({
        service:'gmail',
       auth: {
           user: 'msc1994dc@gmail.com',
           pass: 'msc11dc15'
       }
   });

   // Message object
   let message = {
       from: 'msc1994dc@gmail.com',
       to: `${toEmail}`,
       subject: 'update on meeting',
       text: `Hi, your meeting has been updated by admin. See below details \n ${data}`,

   };

   transporter.sendMail(message, (err, info) => {
       if (err) {
           console.log('Error occurred. ' + err.message);
          // return process.exit(1);
          cb(err,null);
       }

    //    console.log('Email sent: %s', info.messageId);
    //    // Preview only available when sending through an Ethereal account
    //    console.log('Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
       cb(null,info);
   });
}


let meetingReminderEmail = (data,cb)=>{
    let transporter = nodemailer.createTransport({
        service:'gmail',
       auth: {
           user: 'msc1994dc@gmail.com',
           pass: 'msc11dc15'
       }
   });

   // Message object
   let message = {
       from: 'msc1994dc@gmail.com',
       to: `${data.userEmail}`,
       subject: 'reminder for your meeting',
       text: `Hi, here is the reminder for your meeting. please see below details \n ${data}`,

   };

   transporter.sendMail(message, (err, info) => {
       if (err) {
           console.log('Error occurred. ' + err.message);
          // return process.exit(1);
          cb(err,null);
       }

    //    console.log('Email sent: %s', info.messageId);
    //    // Preview only available when sending through an Ethereal account
    //    console.log('Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
       cb(null,info);
   });
}
module.exports = {
    sendForgotPasswordEmail:sendForgotPasswordEmail,
    meetingCreationEmail:meetingCreationEmail,
    meetingUpdatedEmail:meetingUpdatedEmail,
    meetingReminderEmail:meetingReminderEmail
}