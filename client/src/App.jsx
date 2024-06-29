import { useState } from 'react';
import './App.css';
import axios from 'axios';
import {jwtDecode as jwt_decode} from "jwt-decode";
function App() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username: userName,
        password,
      });
      setUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const refreshToken = async () => {
    try {
     const res=  await axios.post('http://localhost:5000/api/refresh', {
        token: user.refreshToken,
      });

      setUser({
        ...user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      console.log(user);
      return res.data;
    } catch (err) {
      console.log(err);
    }
  };


  const axiosJWT = axios.create();

  const handleDelete = async (id) => {
    setSuccess(false);
    setError(false);

    try {
      await axiosJWT.delete('http://localhost:5000/api/users/' + id, {
        headers: { authorization: 'Bearer ' + user.accessToken },
      });
      setSuccess(true);
    } catch (error) {
      setError(true);
    }
  };


  axiosJWT.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decodeToken = jwt_decode(user.accessToken);
      if (decodeToken.exp * 1000 < currentDate.getTime()) {
       
        const data =  await refreshToken();
        config.headers['authorization'] = 'Bearer ' + data.accessToken;
       
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return (
    <div classsName="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? 'admin' : 'user'}dashboard </b>
            <b>{user.username}</b>
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete John
          </button>
          <button className="deleteButton " onClick={() => handleDelete(2)}>
            Delete Jane
          </button>
          {error && (
            <span className="error">
              {' '}
              You are not allowed to delete this user !
            </span>
          )}
          {success && (
            <span className=" success">User has been deleted successfully</span>
          )}
        </div>
      ) : (
        <div className="login">
          <form>
            <span className="formTitle">Abimanyu Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUserName(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="submitButton"
              onClick={handleSubmit}
            >
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
