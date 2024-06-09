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



// Your routes and other configurations here
app.get("/", (req, res)=>{
  res.send('trackEase is running')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
