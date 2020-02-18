require("dotenv").config();

var express 	= require("express"),
	app 		= express(),
	bodyParser 	= require("body-parser"),
	mongoose 	= require("mongoose"),
	flash 		= require("connect-flash"),
	passport	= require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	User 		= require("./models/user"),
	Campground 	= require("./models/campground"),
	Comment 	= require("./models/comment"),
	seedDB 		= require("./seeds");

//requiring routes
var commentRoutes 	 = require("./routes/comments"),
	campgroundRoutes = require("./routes/campgrounds"),
	indexRoutes		 = require("./routes/index");


//mongoose.connect("mongodb://localhost/yelp_camp");
//mongoose.connect("mongodb://localhost/yelp_camp_v9",{ useNewUrlParser: true,  useUnifiedTopology: true});
mongoose.connect(process.env.DB_ATLAS_URL,{ useNewUrlParser: true,  useUnifiedTopology: true}).then(() => {
	console.log('connected to DB!');
}).catch(err => {
	console.log('ERROR: ', err.message);
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB();

//***********************
//PASSPORT CONFIGURATION
//***********************
app.use(require("express-session")({
	secret: "encode my password strong",
	resave: false,
	saveUninitialized: false
}));

app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware, maintain info of user data, i.e. {username & id} of any 
// else undefine if no user logged in, this help to keep track where user login or not 
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	//console.log(req.user);
	next();
});


app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);


// app.listen(3000, function(){
// 	console.log("Server started at PORT: 3000");
// });

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started at " + process.env.PORT + " with Ip: " + process.env.IP);
});