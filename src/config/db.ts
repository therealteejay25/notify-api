import mongoose from "mongoose";

export const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI!).then((connection) => {
        console.log(`DB Connected: ${connection.connection.host}`)
    }).catch((error) => {
        console.log("Error connecting to DB:", error);
    });
};