// In nodejs there is class "Error class " through which one can handle different types of API error

class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors=[],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data=null
        this.message=message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}

// Also we want if error come it wll go through above ApiError for this we will use middleware