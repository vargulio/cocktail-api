const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Users = require('./user.model');
const Sessions = require('./session.model');
const FavoriteCocktail = require('./favoriteCocktai.model');

const bodyParser = require('body-parser');

mongoose.connect('mongodb+srv://admin:admin@cluster0.m5cjunj.mongodb.net/cocktail_api?retryWrites=true&w=majority').then(res => {
  console.log('connected to mongo!');
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, identity, partyName");
  next();
});


app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

app.post('/users', (req, res) => {

  const username = req.body.username;
  const password = req.body.password;

  if(!username || !password) {
    res.status(400).send({message: "This is not a valid JSON or required fields are missing"});
    return;
  }

  Users.find({ username }, (err, result) => {
    if (result && result[0]) {

      res.status(400).send({ message: 'The username is taken!' });
    } else {

      Users.create({
        username,
        password
      }, (err, result) => {
        if (!err) {
          res.status(200).send(result);
        } else {
          res.status(500).send();
        }
      })

    }
  })
})

app.post('/favorite-cocktails', async(req, res) => {

  const cocktailId = req.body.id;
  const sessionId = req.get('identity');

  if(!sessionId ) {
    res.status(401).send({message: "You are not logged in!"});
    return;
  }

  if(!cocktailId ) {
    res.status(400).send({message: "Cocktail id is not provided!"});
    return;
  }

  const session = await Sessions.findById(sessionId).catch(e => {
    console.log('Error finding session');
  });

  if(!session) {
    res.status(400).send({ message: 'Invalid session!' });
    return;
  }

  const user = await Users.find({username: session.username}).catch(e => {
    console.log('Error finding user');
  });

  if(!user || !user[0]) {
    res.status(400).send({ message: 'Invalid user' });
    return;
  }

  const  { username } = user[0];

  const favorite = await FavoriteCocktail.find({username, cocktailId}).catch(e => {
    console.log('Error finding favorites');
  });

  if(favorite?.[0]) {
    res.status(406).send({ message: 'The cocktail is already in favorites!' });
    return;
  }

  const newFavorite = await FavoriteCocktail.create({username, cocktailId}).catch(e => {
    console.log('Error creating favorite');
  });

  if(newFavorite) {
    res.status(200).send({message: "Success!"})
  } else {
    res.status(500).send({message: "Could not create favorite!"});
  }
})

app.delete('/favorite-cocktails', async(req, res) => {

  const cocktailId = req.get('cocktailId');
  const sessionId = req.get('identity');

  if(!sessionId ) {
    res.status(401).send({message: "You are not logged in!"});
    return;
  }

  if(!cocktailId ) {
    res.status(400).send({message: "Cocktail id is not provided!"});
    return;
  }

  const session = await Sessions.findById(sessionId).catch(e => {
    console.log('Error finding session');
  });

  if(!session) {
    res.status(400).send({ message: 'Invalid session!' });
    return;
  }

  const user = await Users.find({username: session.username}).catch(e => {
    console.log('Error finding user');
  });

  if(!user || !user[0]) {
    res.status(400).send({ message: 'Invalid user' });
    return;
  }

  const  { username } = user[0];

  const favorite = await FavoriteCocktail.deleteOne({username, cocktailId}).catch(e => {
    console.log('Error deleting from favorites');
  });

  if(favorite?.deletedCount !== 0) {
    res.status(200).send({message: "Success"});
  } else {
    res.status(400).send({message: "There is no such favorite for this user."})
  }

})

app.get('/favorite-cocktails', async(req, res) => {

  const sessionId = req.get('identity');

  if(!sessionId ) {
    res.status(401).send({message: "You are not logged in!"});
    return;
  }

  const session = await Sessions.findById(sessionId).catch(e => {
    console.log('Error finding session');
  });

  if(!session) {
    res.status(400).send({ message: 'Invalid session!' });
    return;
  }

  const user = await Users.find({username: session.username}).catch(e => {
    console.log('Error finding user');
  });

  if(!user || !user[0]) {
    res.status(400).send({ message: 'Invalid user' });
    return;
  }

  const  { username } = user[0];

  const favorites = await FavoriteCocktail.find({username}).catch(e => {
    console.log('Error deleting from favorites');
  });

  if(favorites) {
    res.status(200).send({favorites: favorites.map(i => i.cocktailId)});
  } else {
    res.status(400).send({message: "There are no favorites for this user."})
  }

})

app.post('/login', (req, res) => {


  const username = req.body.username;
  const password = req.body.password;

  if(!username || !password) {
    res.status(400).send({message: "This is not a valid JSON or required fields are missing"});
    return;
  }

  Users.find({ username, password }, (err, result) => {
    if (result && result[0]) {
      const {username} = result[0];
      Sessions.find({ username }, (err, sessions) => {
        if (sessions && sessions[0]) {
          res.status(200).send({ sessionId: sessions[0].id, username });
        } else {
          Sessions.create({ username }, (err, session) => {
            res.status(200).send({ sessionId: session.id, username });
          })
        }
      })

    } else {

      res.status(400).send({ message: 'Wrong credentials' });

    }
  })
})

app.post('/logout', (req, res) => {

  const id = req.body.id;

  if(!id) {
    res.status(400).send({message: "This is not a valid JSON or required fields are missing"});
    return;
  }

  Sessions.findByIdAndRemove(id, (err, result) => {

    if (result) {
      res.status(200).send();
    } else {
      res.status(400).send({ message: 'No session with this id' });
    }
  })
});






// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});