'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let issueSchema = new Schema({
  id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  title: {
    type: String,
    default: ''
  },
  reporter: {
    type: String,
    default: ''
  },
  reporterId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  assignee: {
    type: String,
    default: ''
  },
  createdOn :{
    type:String,
    default:""
  },
  watch:[{
    id:String,
    name:String
  }],
  description:{
      type:String,
      default:''
  },
  attachments :{
    type:String,
    default:''
  }


})


mongoose.model('Issue', issueSchema);