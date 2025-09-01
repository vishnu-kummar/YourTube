// see, db se interact krne ke liye hum async-await ka use krte hai jaise user.controller ke kaafi saatre function me db hit karana padega,
// information k liye. ab baar-bar hum try catch likhne ki jagah wrappeer function bana le jaise ki asyncHandler. 
// we are craeting this as we don't want to write all those codes like async await,try,catch when connecting with database. in main folder.

// Instead of writing try...catch in every controller, we use this helper.
//If the handler throws an error → passes it to Express error handling (next(err))
const asyncHandler = (requestHandler) => {
   return  (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).   // using promise
        catch((err) => next(err))
    }
}
export {asyncHandler}






/*
YOU CAN USE THIS AS A WRAPPER FUNCTION BUT FOR NOW WE'LL USE ABOVE WRAPPER FUNCTION

const asyncHandler = (fn) => async(req,res,next) => {  // using try catch
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}

*/