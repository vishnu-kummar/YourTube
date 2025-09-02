import dotenv from 'dotenv';
import connectDB from "./db/index.js";

// Load env variables
dotenv.config({
  path: './.env'
});

// Just connect to DB here (no app.listen)
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed", err);
  });



// above code for vercel
// When Vercel runs your backend API, connectDB() will be called in api/index.js.

// No long-running server is started.













// // require('dotenv').config({path: './env'}) import this line after installing dotenv to get access of environmentVariable
// import dotenv from 'dotenv' // to use .env
// import {app} from './app.js'
// import connectDB from "./db/index.js";

// //  "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"   adding experimental 
// dotenv.config({
//     path: './.env'  // under root directory 
// })






// // call connectDB() it connects to MongoDB.If DB connects → start the Express server.If DB fails → log the error.
// // since connectedDb is asynchronus method. when asyncronus method completes it return promise. therefore we use.then and .catch 
// connectDB()
// .then(()=>{
//     app.listen(process.env.PORT || 3000, ()=>{
//         console.log(`Server is running at port : ${process.env.PORT}`);
        
//     })
// })
// .catch((err)=>{
// console.log("MONGO DB CONNECTION FAILED!!",err);

// })









// we will use express in app, mongoose in db and dotenv for .env, so first install them



/*  

--> below code is OUR FIRST APPROACH : USING TRY-CATCH & ASYNC AWIAT.
--> NOTE: WE CAN SIMPLY CONNECT WITH DB [mongoose.connect-your_url] but better approach given below;
--> SECOND APPROACH : write all code in any other folder (here we use db folder) and export this function in main folder like index.js  


import express from 'express';
const app =express()

;(async () => {
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERRR: ",error);
        throw error
        
       })

app.listen(process.env.PORT, ()=>{
    console.log(`App is listeninng on port ${process.env.PORT}`);
    
})

    }catch(error){
            console.error("ERROR: ",error)
            throw err
            
    }
}) ()

*/