import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

/**
 * Middleware to authenticate JWT tokens
 * Attaches user info to req.user if valid
 */
export default function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Invalid token format." 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    // Continue to next middleware/route
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token has expired. Please login again." 
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ 
        success: false,
        message: "Invalid token." 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Authentication failed." 
    });
  }
}