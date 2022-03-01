const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const Post = require("../model/post");
// const isAuth = require("../middleware/is-auth");

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
    return{userId:user._id.toString(),token:token};
  },
  getPosts: async function(args,req){
    const page = req.query.page;
    const POSTS_PER_PAGE = 2;
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().sort({createdAt:-1}).skip((page-1)*POSTS_PER_PAGE).limit(POSTS_PER_PAGE).populate("creator","name");
    return{posts:posts, totalItems: totalItems}
  },
  createPost: async function({postInput}, req){
    let {title,content} = postInput;
    const errors = [];
    title = validator.trim(title);
    content = validator.trim(content);
    if(!validator.isLength(title,{min:5}) || !validator.isLength(content,{min:5})){
      errors.push("Invalid title or content");
    }
    if(errors.length>0){
      const error = new Error("Invalid Input.");
      error.status = 422
      error.data = errors;
      throw error;
    }
    const userId = "621e5fce6e567cd61cbfe9e6";
    const user = await User.findById(userId);
    if(!user){
      throw new Error("This user is not exists");
    }
    const post = new Post({title:postInput.title, content:postInput.content, imageUrl:"fdsafsd", creator:user});
    const createdPost = await post.save();
    user.posts.push(createdPost._id);
    await user.save();
    console.log(createdPost.creator.name);
    return {...createdPost._doc};
  }
}