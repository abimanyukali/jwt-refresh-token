const express = require('express');
const { users } = require('./data');
const jwt = require('jsonwebtoken');
const app = express();
const cors  =require("cors")
app.use(express.json());
app.use(cors())
let refreshTokens = [];
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'mySecretKey', {
    expiresIn: '10s',
  });
};
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    'mySecretRefreshKey'
  );
};
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((data) => {
    return data.username === username && data.password === password;
  });

  if (user) {
    //Generate am access token
    // const accessToken = jwt.sign(
    //   {
    //     id: user.id,
    //     isAdmin: user.isAdmin,
    //   },
    //   'abimanyu.s',
    //   {expiresIn:"20m"}
    // );
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json('Username or Password incorrect ');
  }
});
const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'mySecretKey', (err, user) => {
      if (err) {
        return res.status(403).json('Token is not valid');
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json('You are not authenticated');
  }
};
app.post('/api/refresh', (req, res) => {
  //take the refresh token from the user
  const refreshToken = req.body.token;

  //send error if there is no  token or it's invalid
  if (!refreshToken) return res.status(401).json('You are not authenticated!');
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json('Refresh token is not valid');
  }
  jwt.verify(refreshToken, 'mySecretRefreshKey', (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
  //if everything is ok , create new access token,refresh token and send to user
});
app.post('/api/logout', verify, (req, res) => {
  console.log(refreshTokens);
  const { refreshToken } = req.body.token;
  refreshTokens = refreshTokens.filter((token)=>token !== refreshToken);
  res.status(200).json('You logged out successfully');
  console.log(refreshTokens);
});

app.delete('/api/users/:userId', verify, (req, res) => {

  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json('User has been deleted');
  } else {
    res.status(403).json('You are not allowed to delete this uses!');
  }
});
PORT = 5000;
app.listen(PORT || 8000, () =>
  console.log(`backend server is running ${PORT}`)
);
