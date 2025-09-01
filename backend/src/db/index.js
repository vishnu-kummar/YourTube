import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// either go with try/catch or promise (resolve,reject) to handle error.
// always use async - await (db is far from us) when you interact with database as it take time
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST:${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection error ",error);
        process.exit(1)
    }
}


export default connectDB;


