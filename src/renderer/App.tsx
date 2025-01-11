import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState } from 'react';
import { get, post } from '../requests/requests';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import {
  decrement,
  increment,
  incrementAsync,
  incrementByAmount, incrementIfOdd,
  selectCount
} from './redux/reducers/counterSlice';

function Examples() {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(1000);
  const [value, setValue] = useState(-1);
  const count = useAppSelector(selectCount);
  const dispatch = useAppDispatch();

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
      <h2>Current Value To Add: {value}</h2>
      <button onClick={getExample}>Random</button>
      <button onClick={errorExample}>Error!</button>
      <br /><br />
      <label>Min: </label>
      <input type="number" value={min} onChange={e => setMin(parseInt(e.target.value))} /><br />
      <label>Max: </label>
      <input type="number" value={max} onChange={e => setMax(parseInt(e.target.value))} /><br />
      <button onClick={postExample}>Random Range</button>
      <br /><br />
      {/* Redux Example */}
      <div>
        <span>Current Count: </span>
        <button
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          -
        </button>
        <span>{count}</span>
        <button
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          +
        </button>
      </div>
      <div>
        <button
          onClick={() => dispatch(incrementByAmount(value))}
        >
          Add Amount
        </button>
        <button
          onClick={() => dispatch(incrementAsync(value))}
        >
          Add Async
        </button>
        <button
          onClick={() => dispatch(incrementIfOdd(value))}
        >
          Add If Odd
        </button>
      </div>
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
