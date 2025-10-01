import express, { Request, Response } from "express";
import dotenv from 'dotenv';
import cors from 'cors'
import cookieParser from "cookie-parser";
import { connectDB } from "./src/config/db";
import authControllers from "./src/routes/auth.ts"
import gmailControllers from "./src/routes/gmail.ts"
import twitterControllers from "./src/routes/twitter.ts"

dotenv.config();

const app = express();

const PORT = process.env.PORT!;

app.use(express.json()); 
app.use(cors());
app.use(cookieParser());

connectDB();

app.get("/ping", (req: Request, res: Response) => {
    res.json({ message: "Pong!" });
});

app.use("/auth", authControllers)
app.use("/api/gmail", gmailControllers)
app.use("/api/twitter", twitterControllers)

app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`)
});