var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var router = express.Router();

/* GET home page. */
//exports.index = function(req, res){
//  res.render('index', { title: 'Express' });
//};

router.get('/', function(req, res, next) {
  res.render('index');
});

// Create a user
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)
  
  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

// Authenticate a user login
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

//req=request object from the client
//res=response object to send back
router.get('/posts', function (req, res, next) {
    //grab all of the posts from the mongoose model which === the mongodb schema
    Post.find(function (err, posts) {
        //if we get an error, throw it to error handler
        //not sure yet how next works, so also sending to console
        if (err) {
            console.log(err);
            return next(err);
        }
        
        //recieved all of the posts, so send them in the response as a json
        res.json(posts);
    });
});

router.post('/posts', auth, function (req, res, next) {
    //post is going to be created with the Post mongoose model
    //this creates a new object in memory before saving it
    var post = new Post(req.body);
    post.author = req.payload.username;
    console.log('Saved?');
    console.log(post.author);
    post.save(function (err, post) {
        if (err) { return next(err); }
        //no error, so respond with the post?
        //guessing .save adds this to the database,
        //and this res throws it back to the client confirming the save?
        res.json(post);
    });
});

//param auto loads an object rather than reloading it every time
//for this, I need to grab the post ID
//this allows route URLs with :post in them to use this function to
//determine the post to use
//high five
router.param('post', function (req, res, next, id) {
    var query = Post.findById(id);
    query.exec(function (err, post) {
        //first throw an error if found through http
        if (err) { return next(err); }
        //again throw and error if the post does not exist for this id
        if (!post) { return next(new Error("Cannot find post!")); }
        //if no errors, toss post to the request object to use later
        req.post = post;
        //http://stackoverflow.com/questions/8710669/having-a-hard-time-trying-to-understand-next-next-in-express-js
        //next calls the next middleware in the que
        //in this case, it is the route handler
        //at least if used in router.post('/posts:post')
        //here this param is called first, THEN the router finishes after retrieving the post
        return next();
    });
});

//for comment upvotes, I also need a comment param
router.param('comment', function (req, res, next, id) {
    console.log('comment param');
    var query = Comment.findById(id);
    query.exec(function (err, comment) {
        if (err) {return next(err); }
        if (!comment) { return next(new Error("Cannot find comment!")); }
        req.comment = comment;
        return next();
    });
});

//for handling a single post, as explained above,
//we use the 'post' param to figure out what post we're using
//the param handles errors, so this doesn't need to since it wont complete without it
router.get('/posts/:post', function (req, res) {
    //using the populate() method, all of the comments associated with this post
    //are loaded
    req.post.populate('comments', function (err, post) {
    //the post object will be retrieved and added to the req object by
    //the param middleware, so we just have to send the
    //json back to the client
        res.json(req.post);
    });
});

//route for post upvotes
router.put('/posts/:post/upvote', auth, function (req, res, next) {
    console.log('upvote');
    req.post.upvote(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});

//route for post downvotes
router.put('/posts/:post/downvote', auth, function (req, res, next) {
    console.log('downvote');
    req.post.downvote(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});


//comments routing, per post
router.post('/posts/:post/comments', auth, function (req, res, next) {
    //pass the request body into a new Comment mongoose model
    console.log('potato');
    var comment = new Comment(req.body);
    console.log('pajama');
    comment.post = req.post;
    comment.author = req.payload.username;
    //check for errors, and save the comment if none
    comment.save(function (err, comment) {
        if (err) { return next(err); }
        //no http errors, add this comment to the comments array
        req.post.comments.push(comment);
        
        req.post.save(function (err, post) {
            if (err) { return next(err); }
            
            res.json(comment);
        });
    });
});

router.get('/posts/:post/comments', function (req, res) {
    res.json(req.post.comments);
});

//comment upvotes
router.put('/posts/:post/comments/:comment/upvote', auth, function (req, res, next) {
    req.comment.upvote(function (err, comment) {
        if (err) { return next(err); }
        res.json(comment);
    });
});

//comment downvotes
router.put('/posts/:post/comments/:comment/downvote', auth, function (req, res, next) {
    req.comment.downvote(function (err, comment) {
        if (err) { return next(err); }
        res.json(comment);
    });
});

module.exports = router;