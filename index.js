import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbname: "learning_backend",
  })
  .then(() => {
    console.log("Connected to MONGODB");
  })
  .catch((e) => {
    console.log(e);
  });

//create schema (Structure)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

//Model
const usr = mongoose.model("user", userSchema); //using msg we can create a doc

const app = express();


app.use(express.static(path.join(path.resolve(), "public"))); //middleware
app.use(cookieParser())
app.use(express.urlencoded({ extended: true })); //access form data
app.set("view engine", "ejs"); //setting up view engine





 
//login is post bcz we send data like email name pass etc.
app.post("/register",async(req,res)=>{

    const { name, email, password } = req.body
    const findUser = await usr.findOne({email})

    if(findUser){ //if exist
        return res.redirect("/login") 
    }

    const hashedPassword = await bcrypt.hash(password,10)
         //create user
    const user =  await usr.create({ name,email, password: hashedPassword });

    //hide id
    const token = jwt.sign({ _id: user._id}, "asdsad")
    //console.log(token)
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now() + 60 * 1000)
    })
    res.redirect("/")
   
})

app.post("/login",async(req,res)=>{
    const {email,password}= req.body;
    let user = await usr.findOne({email})

    if(!user){
        return res.redirect("/register")
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        return res.render("login", { email, message: "Incorrect password"})
    }
    //if matched
    const token = jwt.sign({ _id: user._id}, "asdsad")
    //console.log(token)
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now() + 60 * 1000)
    })
    res.redirect("/")
})




const isAuth = async(req,res,next)=>{

    const {token}=req.cookies

    if(token){

       const decoded =  jwt.verify(token,"asdsad")
       //console.log(decoded)
       req.user = await usr.findById(decoded._id);
       next()
    }
    else{
        res.redirect("/login");
    }
}


app.get("/", isAuth,(req,res)=>{
    res.render("logout",{name: req.user.name});
})

//Register
app.get("/register",(req,res)=>{
    res.render("register")
})


app.get("/login",(req,res)=>{
    res.render("login")
})

//Logout
app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now())

    })
    res.redirect("/login")
})



app.listen(5000, () => {
  console.log("Server is working");
});
