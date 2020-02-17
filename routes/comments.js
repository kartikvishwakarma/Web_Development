var express = require("express");
var router = express.Router({mergeParams:true}); // access [:id]  from "/campground" 
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middlewareObj = require("../middleware");

//******************************
// COMMENTS ROUTES
//******************************

//NEW
router.get("/new", middlewareObj.isLoggedIn, function(req, res){
		Campground.findById(req.params.id, function(err, campground){
			if(err){
				console.log(err);
			} else{
				res.render("comments/new", {campground:campground});	
			}
		})
		
	
});
// CREATE
router.post("/", middlewareObj.isLoggedIn, function(req, res){
	//lookuo compgraound using ID
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		} else{
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong");
					console.log(err);
				} else{
					// add username & ID to comment
					comment.author.id = req.user.id;
					comment.author.username = req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					req.flash("success", "Successfully added comment");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
	//create new comment
	//connect new comment to campground
	// redirect campgorund show page

});

// Comments EDIT,
//  not /:comment_id used since /:id already use in campground/:id,  
// which overwrite if we use as, i.e. /:id, so, /campgrounds/:id/comments/:comment_id
router.get("/:comment_id/edit", middlewareObj.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			redirect("back");
		} else{
			res.render("comments/edit", {campground_id:req.params.id, comment:foundComment});
		}
	});
});

//Comments UPADTE
router.put("/:comment_id", middlewareObj.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatdComment){
		if(err){
			res.redirect("back");
		} else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
});

//Delete comment
router.delete("/:comment_id", middlewareObj.checkCommentOwnership,function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		} else{
			req.flash("success", "Comment deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;