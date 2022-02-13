import express from "express"

import Movie from '../models/movie'

const router = express.Router()
const movieModel = new Movie()

router.get('/movies', async (req, res) => {
    const params = req.query
    const movies = await movieModel.getMovies(req.query)

    res.json(movies)
})

export default router