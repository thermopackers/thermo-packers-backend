// controllers/authController.js

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Predefined roles mapped by email (use lowercase for safety)
const predefinedRoles = {
  'marketing1.thermopackers@gmail.com': 'sales',
  'marketing2.thermopackers@gmail.com': 'sales',
  'marketing5.thermopackers@gmail.com': 'sales',
  'marketing6.thermopackers@gmail.com': 'sales',
  'marketing3.thermopackers@gmail.com': 'dispatch',    //block
  'packaging.thermopackers@gmail.com': 'packaging',
  'it.thermopackers@gmail.com': 'accounts',
  'parminder@thermopackers.com': 'accounts',
  'thermopackers@gmail.com': 'accounts',
  'prateek@thermopackers.com': 'accounts',  
  '496saurabh@gmail.com': 'admin',
  'production.thermopackers@gmail.com': 'production',   //shape
  


//   'it.thermopackers@gmail.com': 'sales',
  'chaurasiyapradyumna5955@gmail.com': 'admin',
  'pkchaurasiya5955@gmail.com': 'sales',
//   'devilaxmi3331@gmail.com': 'production',
// //   'pkchaurasiya5955@gmail.com': 'dispatch',
// //   'devilaxmi3331@gmail.com': 'packaging',
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: missing GOOGLE_CLIENT_ID or JWT_SECRET' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase(); // Normalize email
    const name = payload.name;
    const googleId = payload.sub;

    // Only allow predefined users
    if (!predefinedRoles[email]) {
      return res.status(403).json({ message: 'Access denied. You are not an authorized user.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      try {
        const role = predefinedRoles[email];
        user = await User.create({ googleId, email, name, role });
      } catch (dbErr) {
        console.error('User creation error:', dbErr);
        return res.status(500).json({ message: 'User DB error', error: dbErr.message });
      }
    }

    const tokenJwt = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token: tokenJwt });

  } catch (err) {
    console.error('Google login failed:', err);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
};

//getusers
export const getUsers = async (req, res) => {
  try {
    const users = await User.find(); // Assuming you are using mongoose
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
}

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ message: 'Error updating user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};