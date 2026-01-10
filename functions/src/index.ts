import * as dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import { generateAccount } from "./generateAccount";
import { aiChat } from "./aiChat";
import { firebaseConnector } from "./ServerFirebaseConnector";

console.log("Starting functions...");
console.log("GEMINI_API_KEY configured:", !!process.env.GEMINI_API_KEY);

// Initialize the Firebase Admin SDK
firebaseConnector.start();

exports.generateAccount = generateAccount;
exports.aiChat = aiChat;

