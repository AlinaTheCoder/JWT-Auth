import jwt from "jsonwebtoken";

async function validate_token(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header with Bearer token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    // Verify token with explicit error handling
    jwt.verify(token, process.env.ACESS_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired!",
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token. Please login again.",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Token verification failed",
          });
        }
      }
      // If verification successful
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Unexpected error in token validation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
}

export default validate_token;
