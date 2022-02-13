<script>
	import {apiData, movies, maxPage} from './store'

	let orderByType = 'film.title'
	let orderBy = 'asc'
	let limit = 10
	let page = 1

	$: {
		if (page > $maxPage) 
			page = $maxPage
	}

	$: {
		if (page && limit) {
			fetch(`https://sgbdr-api.herokuapp.com/movies?orderByType=${orderByType}&orderBy=${orderBy}&limit=${limit}&page=${page}`)
				.then(response => response.json())
				.then(data => apiData.set(data))
		}
	}
</script>

<main>
	<h1>Sakila</h1>
	<div class="inputs">
		<div class="input">
			<label for="limit">Results: </label>
			<input id="limit" type="number" bind:value={limit} min={1} max={100}>
		</div>
		<div class="input">
			<label for="filter">Filter by:</label>
			<select name="filter" bind:value={orderByType}>
				<option value="film.title">Title</option>
				<option value="category.name">Category</option>
				<option value="rental_number">Number of rentals</option>
			</select>
		</div>
		<div class="input">
			<label for="order">Order by:</label>
			<select name="order" bind:value={orderBy}>
				<option value="desc">Desc</option>
				<option value="asc">Asc</option>
			</select>
		</div>
	</div>
	<h2>Movies</h2>
	<ul>
		{#each $movies as movie}
			<li>{movie.title} - {movie.category} - {movie.rental_rate}€ - {movie.rental_number} rentals - {movie.rating}</li>
		{/each}
	</ul>
	<button on:click={() => page--} disabled={page <= 1}>Previous page</button>
	<input type="number" bind:value={page} min="1" max={$maxPage}>
	<button on:click={() => page++} disabled={page >= $maxPage}>Next page</button>
</main>

<style>
	.inputs {
		display: flex;
		flex-direction: row;
	}
	.input {
		display: flex;
		flex-direction: column;
	}
</style>