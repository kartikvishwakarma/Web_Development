var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: {type:String, unique:true, required:true},
	password: String,
	avatar: String,
	firstName: {type: String, default: "N/A"},
	lastName: {type: String, default: "N/A"},
	email: {type: String, unique:true,  required:true, default: "N/A"},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: {type: Boolean, default:false}	
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);