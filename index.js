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
  const assets = client.db("trackEase").collection("assets")

// user related Data
app.post("/users", async(req, res)=>{
const user = req.body
const result = await users.insertOne(user)
res.send(result)
})
app.get('/users/:email', async(req, res)=>{
const email = req.params.email
const query = {email : email}
const result = await users.findOne(query)
res.send(result)
})
// getting member list of any company
app.get('/users/team/:company', async(req, res)=>{
  const company = req.params.company
  const query = {company : company}
  const result = await users.find(query).toArray()
  res.send(result)
})
// getting employee who are not afilliete with any company
app.get('/free-employee', async(req, res)=>{
  const result = await users.find({company : null}).toArray()
  res.send(result)
})
// adding employee to the specefic team
app.put('/add-employee/:id', async(req, res)=>{
  const id = req.params.id
  const filter = {_id : new ObjectId(id)}
  const options = {upsert:true}
  const updatedDoc = req.body
  const item = {
    $set:{
      company : updatedDoc.company,
      imageUrl2: updatedDoc.imageUrl2,
    }
  
  }
  const result = await users.updateOne(filter, item, options)
  res.send(result)

})


// asset related api
app.post('/add-asset', async(req, res)=>{
  const asset = req.body
  const result = await assets.insertOne(asset)
  res.send(result)
})
app.get('/assets', async(req, res)=>{
  const result = await assets.find().toArray()
  res.send(result)
})
// get asset data for employee in the request page
app.get('/asset/employee/:company', async(req, res)=>{
  const companyName = decodeURIComponent(req.params.company)
  const query = {company: companyName}
  const result = await assets.find(query).toArray()
  res.send(result)
})
app.get('/assets/:id', async(req, res)=>{
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const result = await assets.findOne(query)
  res.send(result)
})
app.put('/update-assets/:id', async(req, res)=>{


  const id = req.params.id
  const filter = {_id: new ObjectId(id)}
  const options = {upsert:true}
  const updatedDoc = req.body
  const item = {
    $set:{
      product : updatedDoc.product,
      quantity: updatedDoc.quantity,
      productType: updatedDoc.productType
    }
  
  }
  const result = await assets.updateOne(filter, item, options)
  res.send(result)
})
// add request for an asset by employee
app.put('/request-for-asset/:id', async(req, res)=>{
  const id = req.params.id
  const filter = {
    _id : new ObjectId(id)
  }
  const options = {
    upsert : true
  }
  const requestedDoc = req.body
  const item = {
    $set:{
      note :requestedDoc.note,
       requestedDate : requestedDoc.requestedDate,
        status : requestedDoc.status,
        requesterEmail : requestedDoc.requesterEmail,
        requesterName : requestedDoc.requesterName
    }
  }
  const result = await assets.updateOne(filter, item, options)
  res.send(result)
})
app.delete('/delete-asset/:id', async (req, res)=>{
  const id = req.params.id
  const filter = {
    _id :new ObjectId(id)
  }
  const result = await assets.deleteOne(filter)
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
