import express from "express"
import cors from "cors"

import router from "./routes"
const app = express()
const port = process.env.PORT ?? 3000

app.use(cors())
app.use('/', router)

app.listen(port, () => {
  console.log(`listening on ${port}`)
});
