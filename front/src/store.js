import {writable, derived} from 'svelte/store'

export const apiData = writable([])

export const movies = derived(apiData, ($apiData) => {
    if ($apiData.movies) {
        return $apiData.movies
    }

    return []
})

export const maxPage = derived(apiData, ($apiData) => {
    if ($apiData.pages && !isNaN($apiData.pages)) {
        return $apiData.pages
    }

    return 1
})