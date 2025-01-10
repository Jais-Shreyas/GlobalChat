const express = require('express');
const app = express();
const User = require('./models/user');
const Chat = require('./models/chat');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const dotenv = require('dotenv');
dotenv.config();


const cors = require('cors');

app.use(cors(process.env.VITE_FRONTEND_URL));

const mongoose = require('mongoose');

const mongoUri = process.env.VITE_MONGO_URI;


async function run() {
  try {
    mongoose.connect(mongoUri);
  } finally {
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
}
run().catch(console.dir);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.send({ isValid: false, message: 'Invalid username or password' });
  }
  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      res.send({ isValid: true, user });
    } else {
      res.send({ isValid: false, message: 'Invalid username or password' });
    }
  });

});

app.post('/signup', async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (foundUser) {
      return res.send({ isValid: false, message: 'Username already taken' });
    }
    const foundEmail = await User.findOne({ email });
    if (foundEmail) {
      return res.send({ isValid: false, message: 'Email already registered' });
    }
    const user = new User({ name, username, email });
    const hash = await bcrypt.hash(password, 12);
    user.password = hash;
    await user.save();
    res.send({ isValid: true, user });
  } catch (e) {
    console.log(e)
    res.send({ isValid: false, message: 'Something went wrong' });
  }
});


app.get('/chat', async (req, res) => {
  const chats = await Chat.find().populate('user');
  res.send(chats || []);
});

app.post('/chat', async (req, res) => {
  const { message, username } = req.body;
  if (!username || !message) {
    return res.send({ isValid: false, message: 'Please login to chat' });
  }
  const user = await User.findOne({ username });
  if (!user) {
    return res.send({ isValid: false, message: 'Please login to chat' });
  }
  const chat = new Chat({
    message,
    user
  });
  await chat.save();
  res.send({ isValid: true, chat });
});

app.delete('/chat/:id', async (req, res) => {
  const { id } = req.params;
  await Chat.findByIdAndDelete(id);
  res.send({ isValid: true, id });
});

app.patch('/chat/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.send({ isValid: false, message: 'Invalid id' });
  }
  const { message } = req.body;
  await Chat.findByIdAndUpdate(id, { message });
  res.send({ isValid: true, id });
});

app.post('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
      return next(err);
    }
    res.send({ isValid: true });
  });
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});