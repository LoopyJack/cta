var React = require('react');
import GMap from './Gmap';
import Marker from './Marker';
import RouteSelector from './RouteSelector';

var ws = new WebSocket('ws://205.178.62.72:8088');


class App extends React.Component {
  constructor(props) {
    super(props);

    this.onRouteCheck = this.onRouteCheck.bind(this);

    this.state = {
      vehicles: [],
      routes: {All: {All: {checked: true}}}
    }
    /* parse websocket message into state */
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.setState({
        vehicles: msg,
        routes: parseRoutes(msg, this.state.routes)});

      console.log(new Date(), this.state.vehicles.length, ': vehicles received');
    }

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
        visible={this.state.routes[v.rt][v.rtdir]['checked']}>
      </ Marker>
    );
    return (
      <div style={style}>
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

  componentDidMount() {

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
}

module.exports = App;



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
