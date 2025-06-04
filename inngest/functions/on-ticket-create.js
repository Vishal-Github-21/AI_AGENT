import { NonRetriableError } from "inngest";
import User from "../../models/user";
import { inngest } from "../client";
import { sendMail } from "../../utils/mailer";
import Ticket from "../../models/ticket.js";
import analyzeTicket from "../../utils/ai.js";


export const onTicketCreated = inngest.createFunction(
    {id:"on-ticket-created",retries:2},
    {event : "ticket/created"},

    async ({event,step})=>{
        try {
            const {ticketId}=event.data;

           
            //fetch from db
            const ticket = await step.run("fetch-ticket",async ()=>{
            const ticketObject = await Ticket.findById(ticketId);

            if(!ticket){
                throw new NonRetriableError("Ticket not found")
            }
            
            return ticketObject

            })

            //updating ticket status to "TODO"
            await step.run("update-ticket-status",async ()=>{
                await Ticket.findByIdAndUpdate(ticket._id,{status :"TODO"})
            })


           //analyzing ticket 
            const aiResponse = await analyzeTicket(ticket);


            //ai processing

            const relatedskills = await step.run("ai-processing",async()=>{
                let skills=[]

                if(aiResponse){
                    await Ticket.findByIdAndUpdate(ticket._id ,{
                        priority: !["low","medium","high"].
                        includes(aiResponse.priority)?"medium"
                        :aiResponse.priority,
                        helfulNotes:aiResponse.helfulNotes,
                        status:"IN_PROGRESS",
                        relatedSkills:aiResponse.relatedSkills
                    })

                    skills= aiResponse.relatedSkills
                }

                return skills
            })


            const moderator = await step.run("assign-moderator",async()=>{
                //mongo db fetching little bit advance
                let user = User.findOne({
                    role :"moderator",
                    skills :{
                        $elemMatch :{
                            $regex : relatedskills.join("|"),
                            $options : "i"
                        },
                    },
                });

                // if moderator not found then assign to admin itself
                if(!user){
                    user = await User.findOne({
                        role : "admin"
                    })
                }

                await Ticket.findById(ticket._id,{
                    assignedTo:user?._id || null
                })

                return user;

            })

            //sending to this user

            await step.run("send-email-notification",
                async ()=>{
                    if(moderator){
                        const finalTicket =await Ticket.findById(ticket._id);
                        await sendMail(
                            moderator.email,
                            "Ticket Assigned",
                          `A new ticket is assigned to you ${finalTicket.title}`
                        )
                    }
                }
            )

            return {success :true}    

            
        } catch (error) {
            console.error("error runing the stps on ticket create js",error.message);

            return {success:false}
            
        }
    }


)



