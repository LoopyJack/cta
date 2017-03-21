import React from 'react';
import InfoWindow from './InfoWindow';

var bluedot = 'https://storage.googleapis.com/support-kms-prod/SNP_2752068_en_v0';
var reddot = 'https://storage.googleapis.com/support-kms-prod/SNP_2752125_en_v0';

class Marker extends React.Component {
  constructor(props) {
    super(props);

    this.onClick.bind(this);

    this.state = {
      active: false
    }
  }

  render() {
    // console.log('Marker:render()...');
    return (
      <div>
        <InfoWindow
          key={this.props.vehicle.vid}
          map={this.props.map}
          marker={this.marker}
          vehicle={this.props.vehicle}
          active={this.state.active}>
        </InfoWindow>
      </div>
    );
  }

  componentDidMount() {
    // console.log('Marker:componentDidMount()...');
    this.drawMarker();

  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('Marker:componentDidUpdate()...');
    if (prevState.active !== this.state.active)
    {
      this.updateMarker();
    }

    if (prevProps !== this.props) {
      if(prevProps.visible !== this.props.visible) {
        this.props.visible ? this.setVisible() : this.setInvisible();
      }
      if(this.marker) {
        let position = new google.maps.LatLng(
          parseFloat(this.props.vehicle.lat), parseFloat(this.props.vehicle.lon));
        this.marker.setPosition(position);
        return;
      }
    }
  }

  componentWillUnmount() {
    // console.log('Marker:componentWillUnmount()...');
    if (this.marker) {
      this.marker.setMap(null);
    }
  }

  setVisible() {
    this.marker.setMap(this.props.map);
  }

  setInvisible() {
    this.marker.setMap(null);
  }

  updateMarker() {
    if (this.state.active) {
      this.marker.setIcon(undefined);
    } else {
      this.props.vehicle.dly ?
        this.marker.setIcon(bluedot) : this.marker.setIcon(reddot);
    }
  }

  drawMarker() {
    let position = new google.maps.LatLng(
      parseFloat(this.props.vehicle.lat), parseFloat(this.props.vehicle.lon));
    let visible = this.props.visible ? this.props.map : null;
    let icon = this.props.vehicle.dly ? bluedot : reddot;
    const pref = {
      map: visible,
      position: position,
      icon: icon
    };

    this.marker = new google.maps.Marker(pref);

    this.marker.addListener('click', () => {
      this.onClick();
    });
  }

  onClick() {
    this.setState({
      active: !this.state.active
    });
  }
}

module.exports = Marker;
