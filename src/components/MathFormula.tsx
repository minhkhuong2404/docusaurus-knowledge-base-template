import React from 'react';

interface MathFormulaProps {
  id:
    | 'optimal-threads'
    | 'tomcat-threads-calc'
    | 'throughput-calc'
    | 'hikari-pool-size' | 'hikari-pool-calc'
    | 'optimal-exec-conns'
    | 'active-queries-calc'
    | 'db-cores-calc';
}

export default function MathFormula({ id }: MathFormulaProps): React.JSX.Element {
  return (
    <div className="math-formula-card">
      {id === 'optimal-threads' && (
        <>
          <strong>Optimal Threads</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>Available Cores</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>Target CPU Utilization</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>( 1 + </span>
          <span className="fraction">
            <span className="num">Wait Time</span>
            <span className="den">Compute Time</span>
          </span>
          <span> )</span>
        </>
      )}

      {id === 'tomcat-threads-calc' && (
        <>
          <strong>Tomcat Threads</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>2</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>0.8</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>( 1 + </span>
          <span className="fraction">
            <span className="num">50</span>
            <span className="den">5</span>
          </span>
          <span> )&nbsp;=&nbsp;</span>
          <span>1.6</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>11&nbsp;=&nbsp;</span>
          <span>17.6</span>
          <span>&nbsp;&approx;&nbsp;</span>
          <strong>18 threads</strong>
        </>
      )}

      {id === 'throughput-calc' && (
        <>
          <strong>Throughput</strong>
          <span>&nbsp;=&nbsp;</span>
          <span className="fraction">
            <span className="num">18</span>
            <span className="den">0.055</span>
          </span>
          <span>&nbsp;&approx;&nbsp;</span>
          <strong>327 RPS per instance</strong>
        </>
      )}

      {id === 'hikari-pool-size' && (
        <>
          <strong>Hikari Pool Size</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>max-threads</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span className="fraction">
            <span className="num">Connection Hold Time</span>
            <span className="den">Total Request Time</span>
          </span>
        </>
      )}

      {id === 'hikari-pool-calc' && (
        <>
          <strong>Hikari Pool Size</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>18</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span className="fraction">
            <span className="num">50</span>
            <span className="den">55</span>
          </span>
          <span>&nbsp;=&nbsp;</span>
          <span>16.3</span>
          <span>&nbsp;&approx;&nbsp;</span>
          <strong>17 connections</strong>
        </>
      )}

      {id === 'optimal-exec-conns' && (
        <>
          <strong>Optimal Executing Connections</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>( Database CPU Cores</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span>2 )</span>
          <span>&nbsp;+&nbsp;</span>
          <span>Spindle</span>
        </>
      )}

      {id === 'active-queries-calc' && (
        <>
          <strong>Active executing queries</strong>
          <span>&nbsp;=&nbsp;</span>
          <span>85</span>
          <span>&nbsp;&times;&nbsp;</span>
          <span className="fraction">
            <span className="num">5ms</span>
            <span className="den">50ms</span>
          </span>
          <span>&nbsp;=&nbsp;</span>
          <strong>8.5 queries</strong>
        </>
      )}

      {id === 'db-cores-calc' && (
        <>
          <strong>Database Cores</strong>
          <span>&nbsp;=&nbsp;</span>
          <span className="fraction">
            <span className="num">Executing Connections</span>
            <span className="den">2</span>
          </span>
          <span>&nbsp;=&nbsp;</span>
          <span className="fraction">
            <span className="num">8.5</span>
            <span className="den">2</span>
          </span>
          <span>&nbsp;=&nbsp;</span>
          <span>4.25</span>
          <span>&nbsp;&approx;&nbsp;</span>
          <strong>4 to 8 cores</strong>
        </>
      )}
    </div>
  );
}
