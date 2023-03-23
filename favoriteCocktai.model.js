const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const favoriteCocktail = new Schema({
    username: String,
    cocktailId: String,
})

const FavoriteCocktail = mongoose.model('favorites', favoriteCocktail);

module.exports = FavoriteCocktail;