var React = require('react');



class InfoWindow extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return null;
  }

  componentDidMount() {
    let content = formatContent(this.props.vehicle);
    this.infoWindow = new google.maps.InfoWindow({
      content: content
    });

  }

  componentDidUpdate(prevProps) {
    if (prevProps.active !== this.props.active) {
      if (this.props.active) {
        this.infoWindow.open(this.props.map, this.props.marker);
      } else {
        this.closeWindow();
      }
    }

    if (prevProps.vehicle !== this.props.vehicle) {
      let content = formatContent(this.props.vehicle);
      this.infoWindow.setContent(content);
    }
  }

  closeWindow() {
    this.infoWindow.close();
  }

}

var formatContent = function(vehicle) {
  let res = '<h1>Vehicle: ' + vehicle.vid +'</h1>' +
            '<p> Time: ' + vehicle.tmstmp + '<br>' +
            'Route: ' + vehicle.rt + '<br>' +
            'Direction: ' + vehicle.rtdir + '<br>' +
            'Destination: ' + vehicle.des + '<br>' +
            'Lat: ' + vehicle.lat + '<br>' +
            'Long: ' + vehicle.lon + '<br>' +
            'Heading: ' + vehicle.hdg + '<br>' +
            'Distance Traveled: ' + vehicle.pdist + '<br>' +
            'Delayed: ' + vehicle.dly + '<br>' +
            'pid: ' + vehicle.pid + '</p>'
  return res;
}

module.exports = InfoWindow;
