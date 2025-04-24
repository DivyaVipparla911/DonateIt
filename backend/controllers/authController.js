const admin = require('../firebase/firebaseAdmin');
const User = require('../models/User');

const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const newUser = new User({
      uid: userRecord.uid,
      email: userRecord.email,
      user_role: 'user',
    });

    await newUser.save();
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
