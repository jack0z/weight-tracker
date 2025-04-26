import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState([]);

  const handleAddEntry = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      alert('Please enter a valid weight');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(weight)
    };

    setEntries([newEntry, ...entries]);
    setWeight('');
  };

  return (
    <div className="container">
      <Head>
        <title>Weight Tracker</title>
        <meta name="description" content="Simple weight tracker application" />
      </Head>

      <main className="main">
        <h1 className="title">Weight Tracker</h1>

        <div className="card">
          <h2>Add New Entry</h2>
          <div className="form">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight (kg)"
              step="0.1"
            />
            <button onClick={handleAddEntry}>Add</button>
          </div>
        </div>

        <div className="card">
          <h2>Weight History</h2>
          {entries.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No entries yet. Add your first weight above.</p>
          )}
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }

        .main {
          padding: 2rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          max-width: 800px;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .card {
          margin: 1rem 0;
          padding: 1.5rem;
          width: 100%;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
          background-color: white;
        }

        .form {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 16px;
        }

        button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        button:hover {
          background-color: #0051a8;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .table th,
        .table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #eaeaea;
        }

        .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
} 