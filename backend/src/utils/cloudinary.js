// iske through local server ka path use krke cloudinary pr upload krna
// // after cloudinary setup move to controller 

// import {v2 as cloudinary} from 'cloudinary';
// import fs from 'fs';  // it is filesystem, a library in nodejs (fs helps to read , write ,update etc of file) in simple file management k liye uae hota hai


// cloudinary.config({
//     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret:process.env.CLOUDINARY_API_SECRET
// });


// const uploadOnCloudinary = async (localFilePath)=>{
//     try {
//         if(!localFilePath) return null
//         // upload file on cloudinry
//         const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type:"auto"
//         })
//         // file uploaded
//        // console.log("Uploaded on cloudinary",response.url);
//        fs.unlinkSync(localFilePath)
//         return response;
        
//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally save tempory file as operation get failed
//         return null;
//     }
// }

// export {uploadOnCloudinary}


import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // Try to delete local file (with error handling)
        try {
            const fs = await import('fs');
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (deleteError) {
            console.warn("Could not delete local file:", deleteError.message);
        }
        
        return response;
        
    } catch (error) {
        // Try to cleanup local file on error too
        try {
            const fs = await import('fs');
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (deleteError) {
            console.warn("Could not cleanup local file after error:", deleteError.message);
        }
        
        return null;
    }
}

export { uploadOnCloudinary };



