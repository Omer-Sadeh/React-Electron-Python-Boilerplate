import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React from 'react';
import { get, post } from '../requests/requests';
import { Counter } from './redux/reducers/counter/Counter';

function Examples() {
  const [min, setMin] = React.useState(0);
  const [max, setMax] = React.useState(1000);
  const [value, setValue] = React.useState(-1);

  const getExample = async () => {
    await get('get_example',
      (data) => setValue(data),
      (err) => {
        console.error(err.message);
        setValue(-1);
      }
    );
  }

  const postExample = async () => {
    let body = {
      minimum: min,
      maximum: max
    }
    await post('post_example', body,
      (data) => setValue(data),
      (err) => {
        console.error(err.message);
        setValue(-1);
      }
    );
  }

  const errorExample = async () => {
    await get('error_example',
      (data) => setValue(data),
      (err) => {
        console.error(err);
        setValue(-1);
      }
    );
  }

  return (
    <div>
      <h1>Hello, Electron!</h1>
      <h2>Current Value: {value}</h2>
      <button onClick={getExample}>Random</button>
      <button onClick={errorExample}>Error!</button>
      <br /><br />
      <label>Min: </label>
      <input type="number" value={min} onChange={e => setMin(parseInt(e.target.value))} /><br />
      <label>Max: </label>
      <input type="number" value={max} onChange={e => setMax(parseInt(e.target.value))} /><br />
      <button onClick={postExample}>Random Range</button>
      <br/><br/>
      <Counter />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Examples />} />
      </Routes>
    </Router>
  );
}
