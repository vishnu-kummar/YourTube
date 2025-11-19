import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express()




// app.use(cors({  // we mostly use app.use on dealing with middleware or configuration setting
//   origin: "http://localhost:5173",   // your frontend URL
//   credentials: true,                 // allow cookies & Authorization headers
// }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://yourtube-backend.vercel.app",
    "https://yourtube-frontend.vercel.app" // Your actual frontend URL
  ],
  credentials: true
}));



// data khi se aa skta hai url se,json se , body se toh uske liye setting below
app.use(express.json({limit: "16kb"}))                              // json se dasta accept
app.use(express.urlencoded({extended:true,limit:"16kb"}))           // url se data
app.use(express.static("public"))

app.use(cookieParser())   // apne server se user ke browser ka cookie acces kr pau aslo set user cookies



// routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'

//routes declaration
app.use("/api/v1/users",userRouter) // let say koi user "/users" type krta hai toh hum use controll denge userRouter ka (user.routes.js)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export {app}