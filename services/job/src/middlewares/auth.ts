import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/User.js";

interface UserType {
  _id: string;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio?: string | null;
  resume?: string | null;
  resume_public_id?: string | null;
  profile_pic?: string | null;
  profile_pic_public_id?: string | null;
  skills?: string[];
  subscription?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: UserType;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authorization header is missing or invalid",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SEC as string
    ) as JwtPayload;

    if (!decodedPayload || !decodedPayload.id) {
      res.status(401).json({
        message: "Invalid Token",
      });
      return;
    }

    const user = await User.findById(decodedPayload.id).select("-password");

    if (!user) {
      res.status(401).json({
        message: "User associated with this token no longer exists.",
      });
      return;
    }

    req.user = user.toObject() as unknown as UserType;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      message: "Authentication Failed. Please login again",
    });
  }
};
