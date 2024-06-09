const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://storyforge-31907.web.app"
      
    ],
    credentials: true,
    optionsSuccessStatus:200,
  })
);
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.axtsmlj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


  const users = client.db("trackEase").collection("users");

// user related Data
app.post("/users", async(req, res)=>{
const user = req.body
console.log(user)
const result = await users.insertOne(user)
res.send(result)
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// Your routes and other configurations here
app.get("/", (req, res)=>{
  res.send('trackEase is running')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
