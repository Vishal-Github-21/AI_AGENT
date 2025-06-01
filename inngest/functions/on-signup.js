// Inngest background function that runs on "user/signup" event.
// It checks if the user exists and sends a welcome email.
// Uses step functions for observability and retries.
// If user not found, throws NonRetriableError to skip retries.

import { NonRetriableError } from "inngest";
import User from "../../models/user";
import { inngest } from "../client";
import { sendMail } from "../../utils/mailer";

export const onUserSignup = inngest.createFunction(
    {id:"on-user-signup",retries:2},
    {event : "user/signup"},
    async ( {event ,step})=>{
        try{
            const {email}=event.data
            const user =await step.run("get-user-email",async()=>{
                const userObject = await User.findOne({email})

                if(!userObject){
                    throw new NonRetriableError("user no longoer exists in our database")
                }
                return userObject;
            })

            await step.run("send-welcome-email",async()=>{
                const subject = `Welcome to the app`
                const message = `Hi,
                \n\n
                Thanks for signing useOptimistic. We're glad to have you onboard!
                `

                await sendMail(user.email,subject,message)
            })

            return {success : true}

        }catch(error){
          console.error("error running step ",error.message)
          return {success:false}
        }
    }
)