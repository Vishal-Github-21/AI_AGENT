import { processEnv } from "inngest/helpers/env"
import jwt from  "jsonwebtoken"

export const authenticate =(req,res,next)=>{
    const token =req.headers.authorization?.spilt(" ")[1]

    if(!token){
        return res.status(401).json({
            error:"Access denied , no token found."
        })
    }

    try {

        const decoded = jwt.verify(token,proces.env.JWT_SECRET);
        req.user =decoded
        next();
        
    } catch (error) {
        
    }
}