import getConnection from '../services/db'

class Movie {
  getMovies = async ({orderByType = 'film.title', orderBy = 'ASC', limit = 10, page = 1}) => {
    const db = await getConnection()
    const [movies] = await db.execute(`SELECT title, rental_rate, rating, category.name AS category, COUNT(rental.rental_id) AS rental_number FROM film 
      LEFT JOIN film_category ON film_category.film_id = film.film_id 
      LEFT JOIN category ON category.category_id = film_category.category_id
      LEFT JOIN inventory ON inventory.film_id = film.film_id
      LEFT JOIN rental ON rental.inventory_id = inventory.inventory_id
      GROUP BY film.film_id
      ORDER BY ${orderByType} ${orderBy}
      LIMIT ${(page - 1) * limit}, ${limit}
      `)

    const [[{movies_number}]] = await db.execute('SELECT COUNT(film_id) AS movies_number FROM film')
    const pages = movies_number / limit
    return {movies, pages}
  }
}

export default Movie