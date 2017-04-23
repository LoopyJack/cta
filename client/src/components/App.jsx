var React = require('react');
import GMap from './Gmap';
import Marker from './Marker';
import RouteSelector from './RouteSelector';

var ws = new WebSocket('ws://205.178.62.72:8000/cta');
// var ws = new WebSocket('ws://localhost/cta');

class App extends React.Component {
  constructor(props) {
    super(props);

    this.onRouteCheck = this.onRouteCheck.bind(this);
    this.requestPattern = this.requestPattern.bind(this);

    this.state = {
      vehicles: [],
      routes: {All: {All: {checked: true}}},
      patterns: {}
    }
    /* parse websocket message into state */
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      /* 'vehicle' msg parse */
      if (msg['vehicles']) {
        this.setState({
          vehicles: msg['vehicles'],
          routes: parseRoutes(msg['vehicles'], this.state.routes)
        });
        console.log(new Date(), this.state.vehicles.length, ': vehicles received');

      /* 'pattern' msg parse */
    } else if (msg['ptr']) {
        let newPatterns = this.state.patterns;
        newPatterns[msg['ptr']['pid']] = msg['ptr'];
        this.setState({
          patterns: newPatterns
        });
      }
    } //ws.onMessage
  }

  render() {
    let style = {
      position: 'relative',
      width: '100%',
      height: '90%'
    }

    const markers = this.state.vehicles.map( (v) =>
      <Marker
        key={v.vid}
        vehicle={v}
        pattern={this.state.patterns[v.pid]}
        visible={this.state.routes[v.rt][v.rtdir]['checked']}
        requestPattern={this.requestPattern}>
      </ Marker>
    );
    return (
      <div style={style}>
        <h2>CTA Bus Tracker</h2>
        <div style={{left: 0, right: 0}}>
          <p>Last Update: {new Date().toLocaleString()}  Total Buses: {this.state.vehicles.length}</p>
        </div>
        <RouteSelector routes={this.state.routes} onCheck={this.onRouteCheck}/>
        <GMap>
          {markers}
        </ GMap>
      </div>
    );
  }


  onRouteCheck(e, rt, dir) {
    let newRoutes = this.state.routes;


    /* if 'All' box is clicked */
    if (rt == 'All') {
      newRoutes['All']['All']['checked'] = e.checked;

      /* if 'All' becomes checked */
      if (e.checked) {
        newRoutes = parseRoutes(this.state.vehicles, this.state.routes);

      /* 'All' becomes unchecked */
      } else {
        Object.keys(newRoutes).map( function(rt) {
          Object.keys(newRoutes[rt]).map( function(dir) {
            newRoutes[rt][dir]['checked'] = false;
          });
        });
      }

    /* Anything besides 'All' is clicked */
    } else {
      newRoutes[rt][dir]['checked'] = e.checked;

      if (!e.checked) {
        newRoutes['All']['All']['checked'] = e.checked;
      }
    }
    this.setState({routes: newRoutes});
  }


  requestPattern(pid) {
    ws.send(JSON.stringify({
      pid: pid
    }));
  }


}

module.exports = App;



// var parsePatterns = function(vehicles, patterns) {
//   let ret = {};
//
//   vehicles.map( function(v) {
//     patterns[v.pid] ? ret[v.pid] = patterns[v.pid] : ret[v.pid] = {};
//   });
//
//   return ret;
// }

var parseRoutes = function(vehicles, routes) {
  let ret = {All: {All:{checked: routes['All']['All']['checked']}}};

  vehicles.forEach(function(v) {
    let name = v.rt + ' - ' + v.rtdir;

    if (!ret[v.rt]) {
      ret[v.rt] = {};

    }

    if (routes['All']['All']['checked']) {
      ret[v.rt][v.rtdir] = {checked: true, name: name}
    } else if (Object.keys(routes).length && routes[v.rt] && routes[v.rt][v.rtdir]) {
      ret[v.rt][v.rtdir] = routes[v.rt][v.rtdir];
    } else {
      ret[v.rt][v.rtdir] = {checked: false, name: name};
    }
  });

  return ret;
}
