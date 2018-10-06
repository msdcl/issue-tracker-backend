'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let ForgotSchema = new Schema({

  id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  email: {
    type: String,
  },
 code: {
    type: String,
  }


})


mongoose.model('ForgotPassword', ForgotSchema);