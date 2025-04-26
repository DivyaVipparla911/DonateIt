const admin = require('../firebase/firebaseAdmin');
const User = require('../models/User');

const signup = async (req, res) => {
  const { token, name, dateOfBirth, address } = req.body;

  const parsedDateOfBirth = new Date(dateOfBirth);
  if (isNaN(parsedDateOfBirth)) {
    console.log("Invalid date of birth");
    return res.status(400).json({ message: 'Invalid date of birth' });
  }

  try {
    console.log("saving to firebase");
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists in DB' });
    }

    const newUser = new User({
      uid,
      email,
      user_role: 'user',
      name: name,
      dateOfBirth: parsedDateOfBirth,
      address: address,
    });

    await newUser.save();
    console.log("User saved to MongoDB:", newUser);
    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const signin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ uid: decodedToken.uid });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Login success', role: user.user_role });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const getUserRole = async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ role: user.user_role });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user role' });
  }
};


module.exports = { signup, signin, getUserRole};
