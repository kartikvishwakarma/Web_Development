var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

// root route
router.get("/", function(req, res){
	res.render("landing");
});


//***********************
//AUTHENTICATION ROUTES
//***********************


// SIGN UP , show register form 
router.get("/register", function(req, res){
	res.render("register");
});

//handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User({
			username: req.body.username,
			firstName: req.body.firstname,
			lastName: req.body.lastname,
			email: req.body.email,
			avatar: req.body.avatar
		});
	//registering user, creating DB entries
	if(req.body.adminCode === 'secretcode123'){
		newUser.isAdmin = true;
	}

	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

// LOGIN, handle login form
router.get("/login", function(req, res){
	res.render("login");
});

// router.post("/login", middleware, callback)
// handle login logic

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    }), function(req, res){
});

//LOGOUT ROUTE
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
});


// forgot PASSWORD
router.get("/forgot", function(req, res){
	//req.flash('err', 'success');
	res.render("forgot");
});

router.post("/forgot", function(req, res, next){
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({ email: req.body.email }, function(err, user){
				if(!user){
					req.flash('error', 'No account with that email address exists.');
					return res.redirect("/forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 180000; // half hour
			
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: process.env.SERVER_EMAIL,
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: process.env.SERVER_EMAIL,
				 
				subject: 'Node.js Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password' + 
						'Please click on the following link, or paste this into your browser to complete the process\n' +
						'http://' + req.headers.host + '/reset/' + token + '\n\n' +
						'If you did not request this, please ignore this email and your password will remail unchanged\n'
			};

			smtpTransport.sendMail(mailOptions, function(err){
				console.log('mail sent');
				req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			});
		}
		], function(err){
			if(err) return next(err);
			res.redirect('/forgot');
		});
});

// reset Password

router.get('/reset/:token', function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
		if(!user){
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('reset', {token: req.params.token});
	});
});


router.post('/reset:token', function(req, res){
	async.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
				if(!user){
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
				}
			});
		},

		function(user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: process.env.SERVER_EMAIL,
					pass: process.env.GMAILPW
				}
			});

			var mailOptions = {
				to: user.email,
				from: process.env.SERVER_EMAIL,
				subject: 'Your password has been changed',
				text: 'Hello, \n\n' +
						'This is a confirmation that the password for your account ' + user.email + ' has just changed.' 
			};

			smtpTransport.sendMail(mailOptions, function(err){
				req.flash('success', 'Success! Your password has been changed.');
				done(err);
			});			
		}
		], function(err){
			res.redirect('/compgrounds');
		});
});

// user PROFILE
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Something went wrong.");
			res.redirect("/");
		}
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
			if(err){
				req.flash("error", "Something went wrong.");
				res.redirect("/");
			}
			res.render("users/show", {user: foundUser, campgrounds:campgrounds});
		});
		
	});
});


//middleware
// function isLoggedIn(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	}
// 	req.flash("error", "You need to be Logged In")
// 	res.redirect("/login");
// }

module.exports = router;