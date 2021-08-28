const session = require("express-session");
var genuuid = require("uuid").v4
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const userinfo = require("./models/user.js")
const pptinfo = require("./models/slide.js")
const dbURI = require("./.env");
const express = require("express")
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(session({
    name: "SessionCookie",
    genid: function(req) {
        console.log('new session');
        return genuuid();
    }, 
    secret: "edfnkjrngfkjerfhj",
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
}))

app.set("view engine", "ejs")

mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => {
        app.listen(3000)
        console.log("Listening on port 3000")
    })
    .catch((err) => console.log(err));

app.get("/", (req, res)=>{
    res.redirect("/signin")
})

app.get("/signin", (req, res)=>{
    res.render("signin")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/home", (req, res)=>{
    if(req.session.userid){
        userinfo.findOne({_id: req.session.userid}, (err, data)=>{
            if(err){
                console.log(err)
            } else {
                res.render("home", {ppt: data.slides})
            }
        })
    } else {
        res.redirect("/signin")
    }
})

app.get("/addppt", (req, res)=>{
    if(req.session.userid){
        res.render("addppt")
    } else {
        res.redirect("/home")
    }
})

app.get("/home/:id", (req, res)=>{
    if(req.session.userid){
        userinfo.findOne({_id: req.session.userid}, (err, data)=>{
            if(err){
                console.log(err)
            } else {
                pptinfo.findOne({_id: data.slides[req.params.id - 1]}, (err, info)=>{
                    res.render("display", {pages: info.pagecontent, id: req.params.id})
                })              
            }
        })
    } else {
        res.redirect("/home")
    }
})

app.get("/logout", (req, res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        } else {
            res.redirect("/signin")
        }
    })
})

app.post("/signin", (req, res)=>{
    userinfo.findOne({username: req.body.username}, (err, data)=>{
        if(err){
            console.log(err)
        } else {
            if(data){
                bcrypt.compare(req.body.password, data.password)
                    .then(result => {
                        if(result){
                            req.session.userid = data._id
                            console.log(data._id)
                            console.log(req.session.userid)
                            res.redirect("/home")
                        } else {
                            res.send("Incorrect password")
                        }
                    })
                    .catch(err => console.log(err))
            } else {
                res.send("User not found")
            }

        }
    })
})

app.post("/register", (req, res)=>{
    bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    let user = new userinfo({
                        username: req.body.username,
                        password: hash
                    })
                    user.save()
                        .then(result => {
                            console.log(result)
                            res.redirect("/signin")
                        })
                        .catch(err => console.log(err))})
                .catch(err => console.log(err))
})

app.post("/pptapi", (req, res)=>{
    let ppt = new pptinfo({
        pagecontent: req.body.data
    })
    ppt.save()
        .then(result => {
            userinfo.findOne({_id: req.session.userid}, (err, data) => {
                if(err){
                    console.log(err)
                } else {
                    data.slides.push(ppt._id)
                    data.save()
                        .then(result => {
                            res.redirect("/home")
                        })
                        .catch(err => console.log(err))
                }
            })
        })
        .catch(err => console.log(err))
})

app.post("/home/:id/pptupdateapi", (req, res)=>{
    userinfo.findOne({_id: req.session.userid}, (err, data)=>{
        if(err){
            console.log(err)
        } else {
            console.log(req.body)
            pptinfo.findOneAndUpdate({_id: data.slides[req.params.id - 1]}, {pagecontent: req.body.idk})
                .then(result => {
                    res.redirect("/home")
                })
                .catch(err => console.log(err))
        }
    })
})