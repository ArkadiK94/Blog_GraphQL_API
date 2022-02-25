const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const errorHandle = require("../util/error");


exports.postSignup = async (req, res, next)=>{
  const err = validationResult(req);
  if(!err.isEmpty()){
    const errMsg = new Error("Validation failed");
    errMsg.data = err.array();
    return errorHandle.syncError(errMsg, 422);
  }
  const email = req.body.email;
  const password= req.body.password;
  const name = req.body.name;
  try{
    const user = await User.findOne({email:email});
    if(user){
      errorHandle.syncError("This user is already exists", 403);
    }
    const hasedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({email: email, name: name, password: hasedPassword});
    await newUser.save();
    res.status(201).json({message: "The User was created"});

  }catch(err){
    errorHandle.asyncError(err,next);
  }
}

exports.postLogin = async (req, res, next)=>{
  const email = req.body.email;
  const password = req.body.password;
  try{
    const user = await User.findOne({email:email});
    if(!user){
      errorHandle.syncError("User not found", 404);
    }
    const userId = user._id.toString();
    const doMatch = await bcrypt.compare(password, user.password);
    if(!doMatch){
      errorHandle.syncError("Pls, enter a valid password", 401);
    }
    const token = jwt.sign(
      {
        email: email,
        userId: userId
      }, 
      `${process.env.SECRET_FOR_TOKEN}`,
      {
        expiresIn: "1h"
      } 
    );
    res.status(200).json({token: token, userId: userId});
  }catch(err){
    errorHandle.asyncError(err,next);
  }

}

exports.getStatus = async (req, res, next)=>{
  try{
    const user = await User.findById(req.userId);
    if(!user){
      errorHandle.syncError("User not found", 404);
    }
    res.status(200).json({message:"The status was fetched", status:user.status});
  }catch(err){
    errorHandle.asyncError(err, next)
  }
}

exports.postStatus = async (req, res, next)=>{
  const status = req.body.status;
  try{
    const user = await User.findById(req.userId);
    if(!user){
      errorHandle.syncError("User not found", 404);
    }
    user.status = status;
    await user.save();
    res.status(200).json({message:"The status was updeted"});
  }catch(err){
    errorHandle.asyncError(err, next);
  }

}