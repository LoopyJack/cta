var React = require('react');
var ReactDOM = require('react-dom');

import App from './components/App';



console.log(new Date());

ReactDOM.render(<App />,
                document.getElementById('main'));

// ReactDOM.render(<GMap initialCenter={initialCenter} />,
//                 document.getElementById('main'));
