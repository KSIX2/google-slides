const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const slideSchema = new Schema({
    pagecontent: [{type: String}]
}, {timestamps: true})

const Ppt = mongoose.model("Ppt", slideSchema);
module.exports = Ppt;