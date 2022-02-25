require("dotenv").config();

const path = require("path");

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const errorHandle = require("./util/error");

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

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
    const server = app.listen(8080);
    const io = require("./socket").init(server);
    io.on("connection",()=>{
      console.log("Client connected");
    });
  })
  .catch(err =>{
    errorHandle.syncError(err);
  });