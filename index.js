const express = require('express');
const cors = require('cors');
const moment = require('moment');
require('dotenv').config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require('mongodb');
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
    optionsSuccessStatus: 200,
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
    const reqAssets = client.db("trackEase").collection("reqAssets")

    // user related Data
    app.post("/users", async (req, res) => {
      const user = req.body
      const email = user.email
      const query = {email: email}
      const existingUser = await users.findOne(query)
    if(existingUser){
      return res.send({massage:"user already exist"})
    }

      const result = await users.insertOne(user)
      res.send(result)
    })
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = {
        email: email
      }
      const result = await users.findOne(query)
      res.send(result)
    })
    // getting member list of any company
    app.get('/users/team/:company', async (req, res) => {
      const company = req.params.company
      const query = {
        company: company
      }
      const result = await users.find(query).toArray()
      res.send(result)
    })
    // getting employee who are not afilliete with any company
    app.get('/free-employee', async (req, res) => {
      const result = await users.find({
        company: null
      }).toArray()
      res.send(result)
    })
    // adding employee to the specefic team
    app.put('/add-employee/:id', async (req, res) => {
      const id = req.params.id
      const filter = {
        _id: new ObjectId(id)
      }
      const options = {
        upsert: true
      }
      const updatedDoc = req.body
      const item = {
        $set: {
          company: updatedDoc.company,
          imageUrl2: updatedDoc.imageUrl2,
        }

      }
      const result = await users.updateOne(filter, item, options)
      res.send(result)

    })
    app.patch('/change-packages/:email', async (req, res) => {
     const email = req.params.email
     const updatedPack = req.body.plan;
        const filter = { email: email };
        const update = { $set: { packages: updatedPack } };
    
        const result = await users.updateOne(filter, update);
        
        res.send(result)
    
        
      
    });
    

    // asset related api
    app.post('/add-asset', async (req, res) => {
      const asset = req.body
      const result = await assets.insertOne(asset)
      res.send(result)
    })
    app.get('/assets/:company', async (req, res) => {
      const company = req.params.company
      const filter = req.query.filter;
      const filter2 = req.query.filter2
      const search = req.query.search;
      const sort = req.query.sort
      let query = {
        company : company
      };

      if (search) {
        query.product = {
          $regex: search,
          $options: "i"
        };
      }

      if (filter) {
        if (parseInt(filter) === 1) {
          query.quantity = {
            $gt: 0
          };
        } else if (parseInt(filter) === 0) {
          query.quantity = 0;
        }
      }
      if (filter2) {
        query.productType = filter2;
      }
      const cursor = assets.find(query);

      if (sort) {
        const sortObj = {};
        if (sort === 'quantity-asc') {
          sortObj.quantity = 1; // Ascending order
        } else if (sort === 'quantity-desc') {
          sortObj.quantity = -1; // Descending order
        }
        cursor.sort(sortObj);
      }
      const result = await cursor.toArray()
      res.send(result)
    })
    // getting limited stock asset for hr manager homepage
    
  app.get('/limited-stock/:company', async (req, res) => {
      const company = req.params.company
      const filter = {
        company: company, 
        quantity: {
          $lt: 10
        }
      }
      const result = await assets.find(filter).toArray()

      if (result.length === 0) {
        return res.status(404).send({
          message: 'No limited stock items found for the specified company.'
        });
      }
      res.send(result)
    })
    // pie chart of returnable vs non returnable asset
    app.get('/items-statistics/:company', async (req, res) => {
      const company = req.params.company
      const returnable = await reqAssets.countDocuments({
        company: company,
        productType: 'returnable'
      })
      const nonReturnable = await reqAssets.countDocuments({
        company: company,
        productType: 'non-returnable'
      })
      res.send({
        returnable: returnable,
        nonReturnable: nonReturnable,
      });
    })
    // most requested item for hr
    app.get('/most-requested/:company', async (req, res) => {
      const company = req.params.company
      const filter = {
        company: company
      }
      const topItems = await reqAssets.aggregate([{
          $match: filter
        },
        {
          $group: {
            _id: "$product",
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        },
        {
          $limit: 4
        }
      ]).toArray();
      res.send(topItems);
    })
    // monthly asset request from employee
    app.get('/monthly-requests/:email', async (req, res) => {
      const email = req.params.email;
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

      const requests = await reqAssets.find({
        requesterEmail: email,
        requestedDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }).sort({
        requestedDate: -1
      }).toArray();
      res.send(requests)
    })
    // get assets of employee requested
    app.get('/my-asset/:email', async (req, res) => {
      const email = req.params.email
      const filter = req.query.filter;
      const filter2 = req.query.filter2
      const search = req.query.search;

      const query = {
        requesterEmail: email
      }

      if (search) {
        query.product = {
          $regex: search,
          $options: "i"
        };
      }
      if (filter) {
        query.status = filter
      }
      if (filter2) {
        query.productType = filter2;
      }
      let cursor = reqAssets.find(query);
      const result = await cursor.toArray()
      res.send(result)
    })
    // get all requested asset for the hr
    app.get('/requested-assets/:company', async (req, res) => {
      const company =req.params.company
      const search = req.query.search
      let query = {
        $or: [{ company: company, status: 'pending' }]
      };
      if (search) {
        const searchQuery = {
          $or: [{
              requesterEmail: {
                $regex: search,
                $options: 'i'
              }
            },
            {
              requesterName: {
                $regex: search,
                $options: 'i'
              }
            }
          ]
        };
        query = {
          $and: [query, searchQuery]
        };
      }
      const result = await reqAssets.find(query).toArray()
      res.send(result)
    })
    // get asset data for employee in the request page
    app.get('/asset/employee/:company', async (req, res) => {
      const companyName = decodeURIComponent(req.params.company)
      const filter = req.query.filter;
      const filter2 = req.query.filter2
      const search = req.query.search;
      const query = {
        company: companyName
      }

      if (search) {
        query.product = {
          $regex: search,
          $options: "i"
        };
      }

      if (filter) {
        if (parseInt(filter) === 1) {
          query.quantity = {
            $gt: 0
          };
        } else if (parseInt(filter) === 0) {
          query.quantity = 0;
        }
      }
      if (filter2) {
        query.productType = filter2;
      }
      let cursor = assets.find(query);
      const result = await cursor.toArray()
      res.send(result)
    })
    // employees pending request 
    app.get('/pending-request/:email', async (req, res) => {
      const email = req.params.email
      const filter = {
        requesterEmail: email,
        status: 'pending'
      }
      const result = await reqAssets.find(filter).toArray()
      res.send(result)
    })
    app.get('/assets/:id', async (req, res) => {
      const id = req.params.id
      const query = {
        _id: new ObjectId(id)
      }
      const result = await assets.findOne(query)
      res.send(result)
    })
    app.get('/download-pdf/:id', async (req, res) => {
      const id = req.params.id
      const query = {
        _id: new ObjectId(id)
      }
      const result = await reqAssets.findOne(query)
      res.send(result)
    })
    app.put('/update-assets/:id', async (req, res) => {


      const id = req.params.id
      const filter = {
        _id: new ObjectId(id)
      }
      const options = {
        upsert: true
      }
      const updatedDoc = req.body
      const item = {
        $set: {
          product: updatedDoc.product,
          quantity: updatedDoc.quantity,
          productType: updatedDoc.productType
        }

      }
      const result = await assets.updateOne(filter, item, options)
      res.send(result)
    })
    // update asset after approving asset
    app.patch('/approve-asset/:id', async (req, res) => {
      const id = req.params.id
      const assetId = req?.body?.assetId
      
      const query = {
        _id: new ObjectId(assetId)
      }
      const asset = await assets.findOne(query)
      const quantity = asset?.quantity
      if (quantity === undefined || quantity <= 0) {
        res.status(400).send({
          message: 'Insufficient quantity'
        });
        return;
      }
      const updateQuantity = {
        $set: {
          quantity: quantity - 1
        }
      }
      const updateMainAsset = await assets.updateOne(query, updateQuantity)
      const filter = {
        _id: new ObjectId(id)
      }
      const options = {
        upsert: true
      }
      const updatedDoc = req.body
      const item = {
        $set: {
          status: updatedDoc.status,
          approvedDate: updatedDoc.approvedDate
        }

      }
      const result = await reqAssets.updateOne(filter, item, options)
      res.send({
        updateMainAsset,
        result
      })
    })
    // Reject asset by hr
    app.patch('/reject-asset/:id', async (req, res) => {
      const id = req.params.id
      const filter = {
        assetId: id
      }
      const options = {
        upsert: true
      }
      const updatedDoc = req.body
      const item = {
        $set: {
          status: updatedDoc.status
        }

      }
      const result = await reqAssets.updateOne(filter, item, options)
      res.send(result)
    })

    // return data from employee
    app.patch('/return-asset/:id', async (req, res) => {
      const id = req.params.id
      const assetId = req?.body?.assetId
      const query = {
        _id: new ObjectId(assetId)
      }
      const asset = await assets.findOne(query)
      const quantity = asset?.quantity
      const updateQuantity = {
        $set: {
          quantity: quantity + 1
        }
      }
      const updateMainAsset = await assets.updateOne(query, updateQuantity)
      const filter = {
        _id: new ObjectId(id)
      }
      const options = {
        upsert: true
      }
      const updatedDoc = req.body
      const item = {
        $set: {
          status: updatedDoc.status,
          approvedDate: ''
        }

      }
      const result = await reqAssets.updateOne(filter, item, options)
      res.send({
        updateMainAsset,
        result
      })
    })
    // add request for an asset by employee
    app.post('/request-for-asset', async (req, res) => {
      const reqAsset = req.body
      const result = await reqAssets.insertOne(reqAsset)

      res.send(result)
    })
    // requested asset delete from the employee
    app.delete('/delete-req/:id', async (req, res) => {
      const id = req.params.id
      console.log(id)
      const filter = {
        _id: new ObjectId(id)
      }
      const result = await reqAssets.deleteOne(filter)
      res.send(result)
    })
    app.delete('/delete-asset/:id', async (req, res) => {
      const id = req.params.id
      const filter = {
        _id: new ObjectId(id)
      }
      const result = await assets.deleteOne(filter)
      res.send(result)
    })
    // create sign up payment intent 
    
// create payment intent 
    app.post('/payment-intent', async(req, res)=>{
      const {price} = req.body
      const amount = parseInt(price * 100)
      const paymentIntent =await stripe.paymentIntents.create({
        amount: amount,
        currency:"usd",
        payment_method_types:[
          "card"
        ],
        
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({
      ping: 1
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// Your routes and other configurations here
app.get("/", (req, res) => {
  res.send('trackEase is running')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});