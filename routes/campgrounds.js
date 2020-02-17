var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middlewareObj = require("../middleware");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'opencage',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//  INDEX
router.get("/", function(req, res){
	//Gel all campgrounds from DB
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Campground.find({name: regex}, function(err, allcampgrounds){
      if(err){
        req.flash("error","Some thing went wrong. Try later !!! ");
        res.redirect("/");
      } else{
        if(allcampgrounds.length === 0){
          req.flash("error", "No match found !!!");
          res.redirect("/campgrounds");
        } else{
          res.render("campgrounds/index", {campgrounds: allcampgrounds});
        }
      }
    });
  } else{
      Campground.find({}, function(err, allcampgrounds){
      if(err){
        console.log(err);
      } else{
        
        res.render("campgrounds/index", {campgrounds:allcampgrounds});
      }
    });
  }
	
});



//CREATE - add new campground to DB
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  //var image = req.body.image;
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  
  //eval(require('locus'));
  
  geocoder.geocode(req.body.location, function (err, data) {
   //console.log(err);
	 //console.log(data);
   

    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;

    cloudinary.uploader.upload(req.file.path, function(result) {
    // add cloudinary url for the image to the campground object under image property
    var image = result.secure_url;
    // add author to campground
    
    var location = data[0].state;
    var newCampground = {name: name, price:price, image: image,  description: desc, author:author, location: location, lat: lat, lng: lng};
    Campground.create(newCampground, function(err, newcampground) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/campgrounds/' + newcampground.id);
    });
  });
    //var location = data[0].formattedAddress;
  });
});

// NEW
router.get("/new",middlewareObj.isLoggedIn,function(req, res){
	res.render("campgrounds/new");
});

// SHOW
router.get("/:id",function(req, res){
	var id = req.params.id;
	Campground.findById(id).populate("comments").exec(function(err, foundCamground){
		if(err){
			console.log(err);
		} else{
			//console.log(foundCamground);
			res.render("campgrounds/show", {campground:foundCamground});
		}
	});
});

// Edit Campground Routes
router.get("/:id/edit", middlewareObj.checkCampgroundOwnership, function(req, res){
	// is user logged in?
	Campground.findById(req.params.id, function(err, campground){
	res.render("campgrounds/edit", {campground:campground});		
	});
});



// UPDATE CAMPGROUND ROUTE
router.put("/:id", middlewareObj.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.campground.location, function (err, data) {
    //eval(require('locus'));
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    //req.body.campground.location = data[0].formattedAddress;
    req.body.campground.location = data[0].state;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});


// Delete Campground Routes
router.delete("/:id", middlewareObj.checkCampgroundOwnership, function(req, res){
	// find and Update the correct campground
	Campground.findByIdAndRemove(req.params.id, req.body.campground, function(err, updatedCampground){
			res.redirect("/campgrounds");
	});
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
