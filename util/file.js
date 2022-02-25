const fs = require("fs");

const errorHandle = require("./error");

exports.deleteFile = (filePath)=>{
  fs.unlink(filePath,(err)=>{
    if(err){
      errorHandle.syncError(err);
    }
  });
}
