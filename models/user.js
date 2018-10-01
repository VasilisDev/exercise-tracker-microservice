'use strict';
const shortid = require('shortid');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  _id: {
        type: String,
        default: shortid.generate
    },
  username: {
    type: String,
    required: true,
    unique: true
  }

},{
  timestamps: true,
});

userSchema.plugin(uniqueValidator);
var userModel = mongoose.model('User', userSchema);

module.exports = userModel;
