import multer from "multer";
import os from "os";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use OS temp directory instead of public/temp
        const tempDir = path.join(os.tmpdir(), 'yourtube-uploads');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        console.log("Temp directory:", tempDir); // Debug log
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Use timestamp + original name to avoid conflicts
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + "-" + file.originalname;
        console.log("Generated filename:", uniqueName); // Debug log
        cb(null, uniqueName);
    }
});

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
        console.log("File received:", file.originalname, file.mimetype); // Debug log
        
        const allowedMimeTypes = [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});


// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/temp")
//   },
//   filename: function (req, file, cb) {
   
//     cb(null, file.originalname)
//   }
// })

// export const upload = multer({
//      storage, 
//     })

// here we'll use multer as middleware whenever we require file uploading capability we inject multer there   