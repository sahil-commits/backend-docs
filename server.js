
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { Server } from "socket.io";
import {mongoose} from "mongoose";
import Document from "./schema/documentSchema.js";


const url = "mongodb+srv://sahil:s2ahil@cluster0.nacyzus.mongodb.net/?retryWrites=true&w=majority";

async function connect() {
  try {
    await mongoose.connect(url);
    console.log("database connected");
    return true;
  } catch (error) {
    console.log("error", error);
    return false;
  }
}

(async () => {
  const isConnected = await connect();

  if (isConnected) {
    const PORT = 9000;

    const app = express();

    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("Roger that server is running");
    })

    // app.post("/signup", async (req, res) => {
    //   const { username, password } = req.body;
    
    //   if (await kv.has(username)) {
    //     res.status(400).json({ error: "Username already exists" });
    //   } else {
    //     await kv.set(username, password);
    //     res.json({ message: "Signup successful" });
    //   }
    // });

    // app.post("/login", async (req, res) => {
    //   const { username, password } = req.body;
    
    //   const storedPassword = await kv.get(username);
    //   if (storedPassword === password) {
    //     const sessionId = uuidv4();
    //     res.json({ sessionId });
    //   } else {
    //     res.status(401).json({ error: "Invalid username or password" });
    //   }
    // });



    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // http://localhost:5173
    const io = new Server(server, {
      cors: {
        origin: ["https://deluxe-daffodil-dd2278.netlify.app","https://backend-doc.onrender.com","https://tubular-llama-6952db.netlify.app"],
        methods: ["GET", "POST"],
      },
    });

    const defaultValue = "";

    io.on("connection", (socket) => {
      console.log("Client connected");
      socket.on("get-document", async (documentId) => {
        console.log("get doc");
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit("load-document", document.data);

        socket.on("send-changes", (delta) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta); // broadcast the changes to all connected clients
        });

        socket.on("save-document", async (data) => {
          await Document.findByIdAndUpdate(documentId, { data });
        });
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });

    async function findOrCreateDocument(id) {
      if (id == null) return;

      const document = await Document.findById(id);
      if (document) return document;

      return await Document.create({ _id: id, data: defaultValue });
    }
  } else {
    console.log("Unable to start server due to database connection failure");
  }
})();
