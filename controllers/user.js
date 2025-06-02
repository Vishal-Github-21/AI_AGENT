import bcrypt from "bcrypt"; // For password hashing
import jwt from "jsonwebtoken"; // For creating and verifying tokens
import User from "../models/user.js"; // User model
import { inngest } from "../inngest/client.js"; // Inngest client for background events

// Signup controller
export const sigup = async (req, res) => {
  const { email, password, skills = [] } = req.body;

  try {
    // Hash the user's password
    const hashed = await bcrypt.hash(password, 10);

    // Create a new user with hashed password
    const user = await User.create({ email, password: hashed, skills });

    // Send a background event to Inngest
    await inngest.send({
      name: "user/signup",
      data: { email },
    });

    // Generate a JWT token for the new user
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    // Return user data and token
    res.json({ user, token });

  } catch (error) {
    res.status(500).json({
      error: "Signup failed",
      details: error.message,
    });
  }
};

// Login controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found :)" });
    }

    // Compare password with hashed one in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    // Return user data and token
    res.json({ user, token });

  } catch (error) {
    res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
};

// Logout controller (token-based validation only)
export const logout = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    });

    // No actual session invalidation here (just a placeholder)
    res.json({ message: "Logout successfully" });

  } catch (error) {
    res.status(500).json({
      error: "Logout failed",
      details: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  
    const {skills =[],role,email}=req.body;

    try {
        if(req.user?.role!=="admin"){
            return res.status(401).json({
                error:"user forbidden"
            })
        }


        const user=await User.findOne({email});

        if(!user){
            return res.status(401).json({error:"User not found"});
        }

        await User.updateOne(
            {email},
            {skills : skills.length? skills :user.skills ,role}
    )
        
    } catch (error) {
            res.status(500).json({
      error: "update failed",
      details: error.message,
    });
    }

    
}
export const getUsers = async (req, res) => {
  try {
    if(req.user.role!=="admin"){
        return res.status(403).json({
            error:"Forbidden"
        })
    }
    const users = await User.find().select("-password")

    return res.json(users)


    
  } catch (error) {

       res.status(500).json({
      error: "failed to get users",
      details: error.message,
    });
    
  }
    
}
