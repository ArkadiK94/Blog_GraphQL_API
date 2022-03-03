require("dotenv").config();

const path = require("path");

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const {graphqlHTTP} = require("express-graphql");

const errorHandle = require("./util/error");
const deleteFile = require("./util/file").deleteFile;
const graphqlResolver = require("./graphql/resolvers");
const graphqlSchema = require("./graphql/schema");
const auth = require('./middleware/auth');

const app = express();

const fileStroage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, "images");
  },
  filename: (req,file,cb)=>{
    const date = new Date().toISOString().replace(/:/g,".");
    cb(null, `${date}-${file.originalname}`);
  }
});

const fileFilter = (req,file,cb)=>{
  if(file.mimetype === 'image/png' || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(express.json());
app.use(multer({storage: fileStroage, fileFilter: fileFilter}).single("image"));
app.use("/images", express.static(path.join(__dirname,"images")));

app.use((req, res, next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods", "POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if(req.method === "OPTIONS"){
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image",(req, res, next)=>{
  if(!req.isAuth){
    const error = new Error("Not Authenticated");
    error.status = 401;
    throw error;
  }
  if(!req.file){
    return res.status(200).json({message:"Image was not provided"})
  }
  if(req.body.oldPath){
    deleteFile(req.body.oldPath);
  }
  return res.status(201).json({message:"Image was stored", filePath:req.file.path.replace(/\\/,"/")});
});

app.use("/graphql",graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err){
    if(!err.originalError){
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || "An error occurred."
    const code = err.originalError.status || 500;
    return {message: message, data: data, status: code}
  }
}));

app.use((req,res,next)=>{
  errorHandle.syncError("Page Not Found", 404);
});


app.use((err, req, res, next)=>{
  let statusCode = err.httpStatusCode;
  if(!statusCode){
    statusCode = 500;  
  }
  res.status(statusCode).json({message:`${err}`, err:err});
});

mongoose.connect(process.env.MONGODB_URI)
  .then(()=>{
    app.listen(8080);
  })
  .catch(err =>{
    errorHandle.syncError(err);
  });