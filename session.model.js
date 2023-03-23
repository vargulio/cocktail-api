const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const sessionSchema = new Schema({
    username: String
})

const Sessions = mongoose.model('Sessions', sessionSchema);

module.exports = Sessions;