import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Editor from './components/editor';
import test from 'xuwentao-personal-dist'

// import * as serviceWorker from './serviceWorker';

console.log(test)

ReactDOM.render(<Editor />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister()
