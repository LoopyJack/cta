import React from 'react';

class GMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = { zoom: 12,
                   initialCenter: this.props.initialCenter};
  }


	render() {
    let style = {
      overflow: 'hidden',
      height: '100%',
      verticalAlign: 'top'
    }

    let mapStyle = {
      height: '100%',
      width: '100%'
    }

    // let mapStyle = {height:'600px', width:'100%'}

    return (
      <div className="GMap" style={style}>

        <div className='GMap-canvas' ref="mapCanvas" style={mapStyle}>
          Loading Map...
        </div>
        {this.renderChildren()}
      </div>
    )
  }

  renderChildren() {
    // console.log('Gmap:renderChildren()...');
    const kids = this.props.children;

    if (!kids) return;

    return React.Children.map(kids, (k) => {
      return React.cloneElement(k, {
        map: this.map
      });
    })
  }


  componentDidMount() {
    // console.log('Gmap:componentdidmount()...');
    // create the map, marker and infoWindow after the component has
    // been rendered because we need to manipulate the DOM for Google =(
    this.map = this.createMap()
    // this.marker = this.createMarker()
    // this.infoWindow = this.createInfoWindow()

    // have to define google maps event listeners here too
    // because we can't add listeners on the map until its created
    google.maps.event.addListener(this.map, 'zoom_changed', ()=> this.handleZoomChange())
  }


  componentDidUpdate(prevProps, prevState) {

  }


  // clean up event listeners when component unmounts
  componentDidUnMount() {
    google.maps.event.clearListeners(map, 'zoom_changed')
  }


  createMap() {
    // console.log('createMap...');
    let mapOptions = {
      zoom: this.state.zoom,
      center: this.mapCenter()
    }
    return new google.maps.Map(this.refs.mapCanvas, mapOptions)
  }

  mapCenter() {
    let res = new google.maps.LatLng(
      this.props.initialCenter.lat,
      this.props.initialCenter.lng
    )
    return res
  }


  createInfoWindow() {
    let contentString = "<div class='InfoWindow'>I'm a Window that contains Info Yay</div>"
    return new google.maps.InfoWindow({
      map: this.map,
      anchor: this.marker,
      content: contentString
    })
  }

  handleZoomChange() {
    this.setState({
      zoom: this.map.getZoom()
    })
  }
}

GMap.propTypes =  {
  initialCenter: React.PropTypes.objectOf(React.PropTypes.number).isRequired,
  zoom:          React.PropTypes.number,
  centerAroundCurrentLocation: React.PropTypes.bool
}

GMap.defaultProps = {
  initialCenter: {lat: 41.8781, lng: -87.6998},
  centerAroundCurrentLocation: false
}

module.exports = GMap;
