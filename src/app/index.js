const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

const dns = require('dns')
dns.resolve4('localhost', console.log)
dns.resolve6('localhost', console.log)

// Environment variables
const {
  PORT,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOST,
  MONGO_DB,
  MONGO_COLLECTION
} = process.env

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}?retryWrites=true&w=majority`

const app = express()
const port = PORT

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect()
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } catch (error) {
    console.error(error)
  }
}

run()

const getDBResults = async ({ page, limit }) => {
  try {
    const db = client.db(MONGO_DB)
    const allScans = db.collection(MONGO_COLLECTION)

    const total = await allScans.countDocuments()

    const pages = Math.ceil(total / limit)

    const options = {
      limit: limit || 10,
      skip: page ? (page - 1) * limit : 0,
      sort: { _id: -1 }
    }

    const results = await allScans.find({}, options).toArray()
    return { results, total, pages }
  } catch (error) {
    console.error(error)
    return []
  }
}

app.get('/', async (req, res) => {
  const { page, limit } = req.query

  try {
    await client.connect()
    const dbResults = await getDBResults({ page: 1, limit: 2 })
    res.send(JSON.stringify(dbResults))
  } catch (error) {
    console.error(error)
    res.status(500).send('An error occurred.')
  } finally {
    await client.close()
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
