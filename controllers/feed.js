const {validationResult} = require("express-validator");

const Post = require("../model/post"); 
const User = require("../model/user");
const errorHandle = require("../util/error");
const fileHelper = require("../util/file"); 
const io = require("../socket");

exports.getPosts = async (req, res, next)=>{
  const page = req.query.page;
  const POSTS_PER_PAGE = 2;
  try{
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().sort({createdAt:-1}).skip((page-1)*POSTS_PER_PAGE).limit(POSTS_PER_PAGE).populate("creator","name");
    res.status(200).json({message: "All posts were fetched", posts: posts, totalItems: totalItems, });

  }catch(err){
    errorHandle.asyncError(err, next);
  }
}

exports.createPost = async (req, res, next)=>{
  const error = validationResult(req);
  if(!error.isEmpty()){
    const errMsg = new Error("Validation failed");
    errMsg.data = error.array();
    return errorHandle.syncError(errMsg, 422);
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace(/\\/,"/");
  let post;
  try{
    const user = await User.findById(req.userId);
    if(!user){
      errorHandle.syncError("User not found", 404);
    }
    post = new Post({title: title, content: content, imageUrl: imageUrl, creator:user});
    await post.save();
    user.posts.push(post._id);
    await user.save();

    io.getIo().emit("posts",{action:"create", post:post});
    res.status(201).json({message: "New post was created", post:post});

  }catch(err){
    errorHandle.asyncError(err,next);
  }
}

exports.getPost = async (req, res, next)=>{
  const postId = req.params.postId;
  try{
    const post = await Post.findById(postId);
    if(!post){
      errorHandle.syncError("Post not found", 404);
    }
    res.status(200).json({message: "The post was fetched", post:post})

  }catch(err){
      errorHandle.asyncError(err, next);
  }
}

exports.editPost = async (req, res, next)=>{
  const error = validationResult(req);
  if(!error.isEmpty()){
    const errMsg = new Error("Validation failed");
    errMsg.data = error.array();
    return errorHandle.syncError(errMsg, 422);
  }
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file;
  let imageUrl = undefined;
  if(image){
    imageUrl = req.file.path.replace(/\\/,"/");
  }
  const postId = req.params.postId;

  try{
    const post = await Post.findById(postId);
    if(!post){
      errorHandle.syncError("Post not found", 404);
    }
    if(post.creator.toString() !== req.userId.toString()){
      errorHandle.syncError("Forbidden", 403);
    }
    post.title = title;
    post.content = content;
    if(imageUrl){
      fileHelper.deleteFile(post.imageUrl);
      post.imageUrl = imageUrl;
    }
    await post.save();
    io.getIo().emit("posts",{action:"edit"});
    res.status(200).json({message: "The post was updated", post:post});
  }catch(err){
    errorHandle.asyncError(err,next);
  }
}

exports.deletePost = async (req, res, next)=>{
  const postId = req.params.postId;
  try{
    const post = await Post.findById(postId);
    if(!post){
      errorHandle.syncError("Post not found", 404);
    }
    if(post.creator.toString() !== req.userId.toString()){
      errorHandle.syncError("Forbidden", 403);
    }
    if(post.imageUrl){
      fileHelper.deleteFile(post.imageUrl);
    }
    await post.remove();
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIo().emit("posts",{action:"delete", postId:postId});
    res.status(200).json({message: "The post was deleted"});
  }catch(err){
    errorHandle.asyncError(err, next)
  }
}




