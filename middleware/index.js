var Campground 	= require("../models/campground"),
	Comment 	= require("../models/comment");

var middlewareObj = {};

// does user own the campground?, 
// since campground is mongoose object & req.user._id is string
// we can't use (===) equality opertator	

middlewareObj.checkCampgroundOwnership = function (req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, campground){
			if(err){
				req.flash("error", "Campground not found");
				res.redirect("back");
			} else{
				if(campground.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}
				else{
					rq.flash("error", "You don't hae permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		req.flash("error", "Please Login First!!");
		redirect("back");	
	}
}

middlewareObj.checkCommentOwnership = function (req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, comment){
			if(err){
				res.redirect("back");
			} else{
				if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}
				else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		redirect("back");	
	}
}

middlewareObj.isLoggedIn = function (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please Login First!");
	res.redirect("/login");
}

module.exports = middlewareObj;



