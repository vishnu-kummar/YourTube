import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp")  // Use /tmp for Vercel compatibility
  },
  filename: function (req, file, cb) {
    // Add timestamp to avoid filename conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Changed from 50MB to 5MB limit
  }
})










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

// // here we'll use multer as middleware whenever we require file uploading capability we inject multer there   