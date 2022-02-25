exports.asyncError = (err,next,statusCode=500) => {
  let newError = err;
  if(!(newError instanceof Error)){
    newError = new Error(err);
  }
  if(!err.httpStatusCode){
    newError.httpStatusCode = statusCode;
  }
  next(newError);
}

exports.syncError = (err,statusCode=500) => {
  let newError = err;
  if(!(newError instanceof Error)){
    newError = new Error(err);
  }
  if(!err.httpStatusCode){
    newError.httpStatusCode = statusCode;
  }
  throw newError;
}