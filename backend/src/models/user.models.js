// mongoose ke through humne data modeling (schmea ) define kiya database i.e mongodb ke liye

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';  // jwt is a bearer token mtlb jiske pass v hai use hum valid user maan ke data ka access de dete hai.
import bcrypt from 'bcrypt';



const userSchema = new mongoose.Schema({

username:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim:true,
    index:true,
},

email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim:true,
},
fullname:{
    type: String,
    required: true,
    trim:true,
    index:true,
},

avatar:{
    type: String,
    required:true,
},

coverImage:{
    type:String,
},

// watchHistory:[  // for this we need to install "npm i mongoose-aggregate-paginate-v2"
//     {
//         type:mongoose.Schema.Types.ObjectId,
//         ref :"Video"
//     }
// ],

password:{       // we will install bcrypt library : it help you to hash passwords  [npm i bcrypt]
    type: String,
    required:[true, 'Password is required']
},

playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist"
  }],

refreshToken:{    // for this we install jsonwebtoken [npm i jsonwebtoken] which is a bear token (it's like key jo v token dega use data mil jaega)
	type:String     // we will write code for token in env
}


},{timestamps:true})

// for password encryption we'll use pre which is a hook (let say hum koi data save karwa rahe hai, hum  chahte hai ki save hone se just 
// pehle koi operation perform karwa de.jaise ki password save hone se pehle use encrypt krwa de.) iske liye pre hook ka use krte hai
// as encyption is a complex process(takes time).threfore, async await .pre("event", function (){} )
userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next(); // agr password modified ho tbhi y pre use hook ho
    this.password = await bcrypt.hash(this.password,10)
    next()
})

// we'll compare whether encrypted password is same as the original password
userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password,this.password)   // it returns boolean value
}


//  token ke liye hum login function banenge controller me
userSchema.methods.generateAccessToken = function(){         //generateAccesToken=short lived
    return jwt.sign({
        _id: this.id,
        email: this.email,
        username:this.username,
        fullname:this.fullname

    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function (){      // generateRefreshToken= long lived
     return jwt.sign({
        _id: this.id,
        

    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema)