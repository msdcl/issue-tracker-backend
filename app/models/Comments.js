'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let comments = new Schema({
  id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  issueId: {
    type: String,
  },
  text: {
    type: String
  },
  date:{
    type:String
  },
  by:{
    type:String
  }


})


mongoose.model('Comment', comments);