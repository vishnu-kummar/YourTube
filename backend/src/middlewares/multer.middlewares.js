import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
   
    cb(null, file.originalname)
  }
})

export const upload = multer({
     storage, 
    })

// here we'll use multer as middleware whenever we require file uploading capability we inject multer there   