// iske through local server ka path use krke cloudinary pr upload krna
// // after cloudinary setup move to controller 

import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';  // it is filesystem, a library in nodejs (fs helps to read , write ,update etc of file) in simple file management k liye uae hota hai


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        // upload file on cloudinry
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file uploaded
       // console.log("Uploaded on cloudinary",response.url);
       fs.unlinkSync(localFilePath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save tempory file as operation get failed
        return null;
    }
}

export {uploadOnCloudinary}



