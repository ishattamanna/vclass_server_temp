const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const frileUploadExpress = require("express-fileupload");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const assetsFolder = path.join(__dirname, "assets");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("hello from vclass server");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tzinyke.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db("vclass_db").collection("users");
    const roomsCollection = client.db("vclass_db").collection("rooms");
    const classCollection = client.db("vclass_db").collection("classes");
    const assignmentsCollection = client
      .db("vclass_db")
      .collection("assignments");


    const submissionsCollection = client.db('vclass_db').collection('submissions')


    app.post("/send-user-to-db", async (req, res) => {
      const user = req.body;
      const findingQuery = { email: user?.email };
      const foundUser = await usersCollection?.findOne(findingQuery);

      if (foundUser) {
        return res.send({ message: "user already exists" });
      } else {
        const confirmation = await usersCollection.insertOne(user);
        return res.send(confirmation);
      }
    });

    app.get("/get-all-user", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    app.put("/send-friend-request", async (req, res) => {
      const sender = req.body.senderEmail;
      const receiver = req.body.receiverEmail;

      const findSender = { email: sender };
      const findReceiver = { email: receiver };

      const option = { upsert: true };

      const updatePendingList = {
        $push: {
          pendingList: receiver,
        },
      };

      const updateFriendRequestList = {
        $push: {
          friendRequestList: sender,
        },
      };

      const senderConfirmation = await usersCollection.updateOne(
        findSender,
        updatePendingList,
        option
      );
      const receiverConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateFriendRequestList,
        option
      );

      res.send({ senderConfirmation, receiverConfirmation });
    });

    app.put("/cancel-friend-request", async (req, res) => {
      const sender = req.body.senderEmail;
      const receiver = req.body.receiverEmail;

      const findSender = { email: sender };
      const findReceiver = { email: receiver };

      const option = { upsert: true };

      const updatePendingList = {
        $pull: {
          pendingList: receiver,
        },
      };

      const updateFriendRequestList = {
        $pull: {
          friendRequestList: sender,
        },
      };

      const senderConfirmation = await usersCollection.updateOne(
        findSender,
        updatePendingList,
        option
      );
      const receiverConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateFriendRequestList,
        option
      );

      res.send({ senderConfirmation, receiverConfirmation });
    });

    app.get("/get-friend-requests", async (req, res) => {
      const query = { email: req.query.email };
      const user = await usersCollection.findOne(query);
      const firendRequests = user?.friendRequestList;
      res.send(firendRequests);
    });

    app.get("/get-db-user", async (req, res) => {
      const query = { email: req.query.email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    app.put("/reject-request", async (req, res) => {
      const sender = req.body.senderEmail;
      const receiver = req.body.receiverEmail;

      const findSender = { email: sender };
      const findReceiver = { email: receiver };

      const option = { upsert: true };

      const updatePendingList = {
        $pull: {
          pendingList: receiver,
        },
      };

      const updateFriendRequestList = {
        $pull: {
          friendRequestList: sender,
        },
      };

      const senderConfirmation = await usersCollection.updateOne(
        findSender,
        updatePendingList,
        option
      );
      const receiverConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateFriendRequestList,
        option
      );

      res.send({ senderConfirmation, receiverConfirmation });
    });

    app.put("/accept-request", async (req, res) => {
      const sender = req.body.senderEmail;
      const receiver = req.body.receiverEmail;

      const findSender = { email: sender };
      const findReceiver = { email: receiver };

      const option = { upsert: true };

      const updatePendingList = {
        $pull: {
          pendingList: receiver,
        },
      };

      const updateFriendRequestList = {
        $pull: {
          friendRequestList: sender,
        },
      };

      const updateSenderFriendList = {
        $push: {
          friendList: receiver,
        },
      };

      const updateReceiverFriendList = {
        $push: {
          friendList: sender,
        },
      };

      const senderConfirmation = await usersCollection.updateOne(
        findSender,
        updatePendingList,
        option
      );
      const receiverConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateFriendRequestList,
        option
      );

      const senderFriendConfirmation = await usersCollection.updateOne(
        findSender,
        updateSenderFriendList,
        option
      );
      const receiverFriendConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateReceiverFriendList,
        option
      );

      res.send({
        senderConfirmation,
        receiverConfirmation,
        senderFriendConfirmation,
        receiverFriendConfirmation,
      });
    });

    app.get("/get-friends", async (req, res) => {
      const query = { email: req.query.email };
      const user = await usersCollection.findOne(query);
      const friendList = user?.friendList;
      res.send(friendList);
    });

    app.put("/unfriend", async (req, res) => {
      const sender = req.body.senderEmail;
      const receiver = req.body.receiverEmail;

      const findSender = { email: sender };
      const findReceiver = { email: receiver };

      const option = { upsert: true };

      const updateSenderFriendList = {
        $pull: {
          friendList: receiver,
        },
      };

      const updateReceiverFriendList = {
        $pull: {
          friendList: sender,
        },
      };
      const senderFriendConfirmation = await usersCollection.updateOne(
        findSender,
        updateSenderFriendList,
        option
      );
      const receiverFriendConfirmation = await usersCollection.updateOne(
        findReceiver,
        updateReceiverFriendList,
        option
      );

      res.send({
        senderFriendConfirmation,
        receiverFriendConfirmation,
      });
    });

    app.post("/make-room", async (req, res) => {
      const roomInfo = req.body;
      const confirmation = await roomsCollection.insertOne(roomInfo);
      res.send(confirmation);
    });

    app.get("/get-rooms", async (req, res) => {
      const userEmail = req.query.email;
      const rooms = await roomsCollection.find({}).toArray();
      const userRooms = rooms.filter((room) =>
        room?.members?.includes(userEmail)
      );
      res.send(userRooms);
    });

    app.get("/get-room", async (req, res) => {
      const query = { _id: new ObjectId(req.query.roomId) };
      const room = await roomsCollection.findOne(query);
      res.send(room);
    });

    app.put("/store-message", async (req, res) => {
      const messageInfo = req.body;
      const findRoom = { _id: new ObjectId(messageInfo?.room) };
      const option = { upsert: true };
      const messageUpdatedDoc = {
        $push: {
          messages: messageInfo,
        },
      };

      const confirmation = await roomsCollection.updateOne(
        findRoom,
        messageUpdatedDoc,
        option
      );

      res.send(confirmation);
    });

    app.get("/get-messages", async (req, res) => {
      const query = { _id: new ObjectId(req.query.roomId) };
      console.log(req.query.roomId);
      const room = await roomsCollection.findOne(query);
      const messages = room?.messages;
      res.send(messages);
    });

    app.post("/upload-file", (req, res) => {
      const { uploadingFile } = req.files;
      try {
        const fileToArray = uploadingFile?.name.split(".");
        const fileExtention = fileToArray[fileToArray?.length - 1];
        const fileName = uuid + "." + fileExtention;
        uploadingFile.mv(path.join(assetsFolder, fileName));
        res.status(200).json({ message: "ok", fileName });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.get("/get-uploaded-file-content", (req, res) => {
      const targetedFileName = req.query.fileName;

      const filePath = path.join(assetsFolder, targetedFileName);

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error(`Error reading file ${targetedFileName}:`, err);
          return;
        }

        // The "data" variable contains the contents of the file
        res.contentType("application/pdf");
        res.send(data);
      });
    });

    app.post("/create-class", async (req, res) => {
      const classInfo = req.body;
      const confirmation = await classCollection.insertOne(classInfo);
      res.send(confirmation);
    });

    app.get("/get-classes", async (req, res) => {
      const userEmail = req.query.email;
      const classes = await classCollection.find({}).toArray();
      const userClasses = classes?.filter((clas) =>
        clas?.members?.includes(userEmail)
      );
      res.send(userClasses);
    });

    app.get("/get-class", async (req, res) => {
      const query = { _id: new ObjectId(req.query.classId) };
      const cls = await classCollection.findOne(query);
      res.send(cls);
    });

    app.post("/post-assignment", async (req, res) => {
      const assignmentInfo = req.body;
      const confirmation = await assignmentsCollection.insertOne(
        assignmentInfo
      );
      res.send(confirmation);
    });

    app.get("/get-assignment-by-class", async (req, res) => {
      const query = { classId: req.query.classId };
      const assignments = await assignmentsCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(assignments);
    });

    app.get("/get-assignment-details", async (req, res) => {
      const query = { _id: new ObjectId(req.query.id) };
      const assignment = await assignmentsCollection.findOne(query);
      res.send(assignment);
    });

    app.delete("/delete-assignment", async (req, res) => {
      const query = { _id: new ObjectId(req.query.id) };
      const confirmation = await assignmentsCollection.deleteOne(query);
      res.send(confirmation);
    });

    app.get('/get-class-members', async (req, res) => {
      const query = { _id: new ObjectId(req.query.classId) };
      const cls = await classCollection.findOne(query);
      const members = cls?.members;
      res.send(members)
    })


    app.put('/add-class-member', async (req, res) => {
      const membersInfo = req.body;
      const findClass = { _id: new ObjectId(membersInfo?.classId) };
      const option = { upsert: true };
      const newArray = membersInfo?.members
      const updatedDoc = {
        $push: {
          members: {
            $each: newArray
          }
        }
      }

      const confirmation = await classCollection.updateOne(findClass, updatedDoc, option)
      res.send(confirmation)


    })


    app.post('/add-submission', async (req, res) => {
      const submission = req.body;
      const confirmation = await submissionsCollection.insertOne(submission);
      res.send(confirmation)
    })

    app.get('/get-submission-by-asnmnt', async (req, res) => {
      const query = { assignmentId: req.query.assignmentId };
      const submissions = await submissionsCollection.find(query).toArray();
      res.send(submissions)
    })

  } finally {
  }
}
run().catch((err) => console.error(err));

io.on("connection", (socket) => {
  console.log(`user Connected :${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`user logedIn with Id :${socket.id} in room:${data}`);
  });
  socket.on("send_message", (data) => {
    // console.log(data);
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("send_db_confirmation", (data) => {
    socket.to(data.room).emit("receive_db_confirmation", data);
  });
});

server.listen(port, () => {
  console.log("Server is running on port :", port);
});
