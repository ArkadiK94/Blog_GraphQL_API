const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const Post = require("../model/post");
const deleteFile = require("../util/file").deleteFile;

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
  getPosts: async function({page},req){
    if(!req.isAuth){
      const error = new Error("Not Authenticated");
      error.status = 401;
      throw error;
    }
    if(!page){
      page = 1;
    }
    const POSTS_PER_PAGE = 2;
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().sort({createdAt:-1}).skip((page-1)*POSTS_PER_PAGE).limit(POSTS_PER_PAGE).populate("creator");

    const changedPosts = posts.map(post=>{
      return{
        ...post._doc,
        _id: post._id.toString(), 
        createdAt: post.createdAt.toISOString(), 
        updatedAt: post.updatedAt.toISOString(),
      }
    });
    return{posts:changedPosts, totalItems: totalItems}
  },
  createPost: async function({postInput}, req){
    if(!req.isAuth){
      const error = new Error("Not Authenticated");
      error.status = 401;
      throw error;
    }
    let {title,content,imageUrl} = postInput;
    const errors = [];
    title = validator.trim(title);
    content = validator.trim(content);
    if(!validator.isLength(title,{min:5}) || !validator.isLength(content,{min:5})){
      errors.push({message:"Invalid title or content"});
    }
    if(errors.length>0){
      const error = new Error("Invalid Input.");
      error.status = 422
      error.data = errors;
      throw error;
    }
    const user = await User.findById(req.userId);
    if(!user){
      throw new Error("This user is not exists");
    }
    const post = new Post({title:title, content:content, imageUrl:imageUrl, creator:user});
    const createdPost = await post.save();
    user.posts.push(createdPost._id);
    await user.save();
    return {
      ...createdPost._doc, 
      _id: createdPost._id.toString(), 
      createdAt: createdPost.createdAt.toISOString(), 
      updatedAt: createdPost.updatedAt.toISOString() 
    };
  },
  getPost: async function({postId}, req){
    if(!req.isAuth){
      const error = new Error("Not Authenticated");
      error.status = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if(!post){
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    return {
      ...post._doc, _id: post._id.toString(), 
      updatedAt: post.updatedAt.toISOString(), 
      createdAt: post.createdAt.toISOString()
    };
  },
  updatePost: async function({postId, postInput}, req){
    if(!req.isAuth){
      const error = new Error("Not Authenticated");
      error.status = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if(!post){
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    if(post.creator._id.toString() !== req.userId.toString()){
      const error = new Error("Not Authorized");
      error.status = 403;
      throw error;
    }
    let {title,content,imageUrl} = postInput;
    const errors = [];
    title = validator.trim(title);
    content = validator.trim(content);
    if(!validator.isLength(title,{min:5}) || !validator.isLength(content,{min:5})){
      errors.push({message:"Invalid title or content"});
    }
    if(errors.length>0){
      const error = new Error("Invalid Input.");
      error.status = 422
      error.data = errors;
      throw error;
    }
    post.title = title;
    post.content = content;
    if(imageUrl){
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    return{
      ...updatedPost._doc, 
      _id: updatedPost._id.toString(), 
      createdAt: updatedPost.createdAt.toISOString(), 
      updatedAt: updatedPost.updatedAt.toISOString() 
    }

  },
  deletePost: async function({postId},req){
    if(!req.isAuth){
      const error = new Error("Not Authenticated");
      error.status = 401;
      throw error;
    }
    const post = await Post.findById(postId);
    if(!post){
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    if(post.creator._id.toString() !== req.userId.toString()){
      const error = new Error("Not Authorized");
      error.status = 403;
      throw error;
    }
    const user = await User.findById(req.userId);
    if(!user){
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    const deletedPost = await post.remove();
    deleteFile(deletedPost.imageUrl);
    user.posts.pull(deletedPost._id);
    await user.save();
    return{deleted:true};
  }
}