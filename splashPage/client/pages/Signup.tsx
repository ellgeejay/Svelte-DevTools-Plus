import React from 'react';
import Header from '../../ToDelete/Header';
const logo = require('../assets/logo.png');
import NavbarLogin from '../components/NavBarLogin';

const Signup = () => {
  return (
    <div className='signup'>
      <NavbarLogin />
      <img src={logo} width='80' height='80' alt='Svelte Logo' />
      <h1>SvelteTool Plus</h1>
      <form>
        <input placeholder='email'></input>
        <br />
        <input placeholder='password'></input>
        <br />
        <button className='loginButton'>Login</button>
      </form>
    </div>
  );
};
export default Signup;
