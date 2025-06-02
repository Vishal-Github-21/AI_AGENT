import express from "express"
import { getUsers, login, sigup, updateUser } from "../controllers/user"
import { authenticate } from "../middlewares/auth"
const router =express.Router()

router.post("/update-user",authenticate,updateUser)
router.get("/users",authenticate,getUsers)

router.post("/signup",sigup)
router.post("/login",login)
router.post("/logout",logout)

export default router