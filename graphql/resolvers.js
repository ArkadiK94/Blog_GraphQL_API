const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");


module.exports = {
  createUser: async function({userInput},req){
    const errors = [],
          password = validator.trim(userInput.password),
          name = validator.trim(userInput.name);
    let email = validator.trim(userInput.email);

    if(!validator.isEmail(email)){
      errors.push({message:"E-Mail is invalid."});
    } else {
      email = validator.normalizeEmail(email);
    }
    const isUserExists = await User.findOne({email: email});

    if(isUserExists){
      throw new Error("This user is already exists");
    }
    if(validator.isEmpty(name)){
      errors.push({message:"Pls, enter a name."});
    }
    if(!validator.isLength(password,{min:5})){
      errors.push({message:"Pls, enter a valid password."});
    }
    if(errors.length>0){
      const error = new Error("Invalid Input.");
      error.status = 422
      error.data = errors;
      throw error;
    }

    const hasedPassword = await bcrypt.hash(password, 12);
    const user = new User({name: name, email: email, password: hasedPassword});
    const createdUser = await user.save();
    return {...createdUser._doc, _id: createdUser._id.toString()}

  },
  login: async function({email,password},req){
    const user = await User.findOne({email:email});
    if(!user){
      const error = new Error("User is not Found");
      error.status = 404;
      throw error;
    }
    const doMatch = await bcrypt.compare(password, user.password);
    if(!doMatch){
      const error = new Error("Password is incorrect");
      error.status = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: email,
        userId: user._id
      }, 
      `${process.env.SECRET_FOR_TOKEN}`,
      {
        expiresIn: "1h"
      } 
    );
    return{_id:user._id.toString(),token:token};
  }
}