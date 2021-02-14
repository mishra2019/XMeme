// getting the required dependencies
const express = require("express");
const bodyParser = require("body-parser");
const methodoverride = require("method-override");
const ejs = require("ejs");
const mongoose = require("mongoose");

//creating an express app
const app = express();

// Express looks up the files relative to the static directory, so the name of the static directory is not part of the URL.
app.use(express.static("public"));

// now setting the view engine which enables us to use static templates
app.set("view engine","ejs");

// using body-parser which returns  middleware that only parses JSON and only
// looks at requests where the Content-Type header matches the type option. This parser
// accepts any Unicode encoding of the body and supports automatic inflation of gzip and deflate
// encodings. bp. urlencoded({ extended: true }) - middleware for parsing bodies from URL.
app.use(bodyParser.urlencoded({extended:true}));

app.use(methodoverride("_method"));

mongoose.connect("mongodb://localhost:27017/memeDB", {useNewUrlParser: true ,useUnifiedTopology: true });

// creating a mongoose schema
const postSchema = new mongoose.Schema({
    // _id: String,
    name: String,
    caption: String,
    url: String
}, {versionKey:false}
);



const Post = mongoose.model("Post", postSchema);



//getting data from index.ejs
app.get("/",function(req,res){
    Post.find({}, function(err, posts){
        // rendering the index.ejs
        res.render("index", { posts: posts });
    });
});

// sending data to the database
app.post("/", (req, res) => {
    //creating new post
    const post = new Post({

        name: req.body.name,
        caption: req.body.caption,
        url: req.body.url
    });

    //checking for duplicate post
    Post.findOne({name: req.body.name}, (err, foundMeme) => {
        if (foundMeme) {
            if (foundMeme.url === req.body.url && foundMeme.caption === req.body.caption) {
                res.render("error409");
            } else {
                console.log("Checking failed");
                post.save( err => {
                  if (!err){
                    c++;
                    res.redirect("/");
                  }
                });
            }
        } else {
            console.log("Checking failed");
            post.save( err => {
                if (!err){

                    res.redirect("/");
                }
            });
        }
    });
});

//********************* Requests Targeting all posts *********************//

app.route("/memes")
    .get((req, res) => {
        Post.find((err, foundMemes) => {
            if (!err) {
                var memes = [];
                for (var i = foundMemes.length-1, j = 0; i >= 0 && j < 100; i--, j++) {
                    memes.push(foundMemes[i]);
                }
                res.send(memes);
            } else {
                res.send(err);
            }
        });
    })

    // handling post request from backend
    .post((req, res) => {
        const newMeme = new Post({

            name: req.body.name,
            caption: req.body.caption,
            url: req.body.url
        });

        // sending data to a database
        Post.findOne({name: req.body.name}, (err,foundMeme) => {
            if (foundMeme) {
                if (foundMeme.url === req.body.url && foundMeme.caption === req.body.caption) {
                    res.render("error409");
                } else {
                    newMeme.save( err => {
                        if (!err){
                            c++;
                            res.send({_id: newMeme._id});
                        } else {
                            res.send(err);
                        }
                    });
                }
            } else {
                newMeme.save( err => {
                    if (!err){
                        c++;
                        res.send({_id: newMeme._id});
                    } else {
                        res.send(err);
                    }
                });
            }
        });
    })

//********************* Requests Targeting a Specific post *********************//

app.route("/memes/:memeId")
    .get((req, res) => {
        Post.findOne({_id: req.params.memeId}, (err, foundMeme) => {
            if (foundMeme) {
                res.send(foundMeme);
            } else {
                res.render("error404");
            }
        });
    })

    // updating meme from backend
    .patch((req, res) => {
        Post.updateOne(
            {_id: req.params.memeId},
            {caption: req.body.caption, url: req.body.url},
            err => {
                if (!err) {
                    res.send("Successfully updated meme.");
                } else {
                    res.send(err);
                }
            }
        );
    });


//Edit Meme Route
app.route("/memes/:id/edit")
    .get((req, res) => {
        Post.findById(req.params.id, (err, foundMeme) => {
            if (err) {
                res.redirect("/");
            } else {
                res.render("edit", {meme: foundMeme});
            }
        });
    })

    .patch((req, res) => {
        Post.updateOne(
            {_id: req.params.id},
            {$set: req.body},
            err => {
                if (!err) {
                    res.redirect("/#" + req.params.id);
                } else {
                    res.send(err);
                }
            }
        );
    })

app.listen(8080, function(){
    console.log("Server running on port 8080");
});
