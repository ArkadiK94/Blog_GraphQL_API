const errorHandle = require("./util/error");

let io;

module.exports = {
  init: httpServer=>{
    io = require("socket.io")(httpServer,{
      cors:{
        origin: "*"
      }
    });
    return io;
  },
  getIo: ()=>{
    if(!io){
      errorHandle.syncError("Socket.io not initialized!");
    }
    return io;
  }
}