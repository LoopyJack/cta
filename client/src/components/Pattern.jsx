var React = require('react');



class Pattern extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      prePattern: [],
      postPattern: [],
      locIdx: 0
    }

    console.log('ptr', this.props.pattern);
    this.props.requestPattern(this.props.vehicle['pid']);

  }

  render() {
    return null;
  }


  initLines() {
    console.log('initlines...');
    console.log(this.props.pattern);
    let pre = [];
    let post = [];
    let idx = 0

    /* create arrays each for before and after portions */
    let i = 0;
    do {
      pre.push({lat: this.props.pattern['pt'][i].lat,
                lng: this.props.pattern['pt'][i].lon});
      i++;
    } while ((this.props.vehicle['pdist'] > this.props.pattern['pt'][i]['pdist']
        || this.props.pattern['pt'][i]['pdist'] == 0)
      && (i < this.props.pattern['pt'].length))

    idx = i;
    i--;

    do {
      post.push({lat: this.props.pattern['pt'][i].lat,
                 lng: this.props.pattern['pt'][i].lon});
      i++;
    } while (i < this.props.pattern['pt'].length)


    this.preLine = new google.maps.Polyline({
      path: pre,
      strokeColor: '#00ff00'
    });

    this.postLine = new google.maps.Polyline({
      path: post,
      strokeColor: '#ff0000'
    });

    this.preLine.setMap(this.props.map);
    this.postLine.setMap(this.props.map);

    this.setState({
      prePattern: pre,
      postPattern: post,
      locIdx: idx
    });
  }

  componentDidMount() {


  }

  componentDidUpdate(prevProps, prevState) {

    /* draw lines if pattern exists */
    if (!prevProps.pattern && this.props.pattern) {
      this.initLines();
    }

    /* update lines if vehicle has moved to new leg of pattern */
    if (prevProps.vehicle['pdist'] !== this.props.vehicle['pdist']
    && this.props.vehicle['pdist'] >= this.props.pattern['pt'][this.state.locIdx]['pdist']) {
      let pre = this.state.prePattern;
      let post = this.state.postPattern;
      let idx = this.state.locIdx

      while (this.props.vehicle['pdist'] >= this.props.pattern['pt'][idx]['pdist']
      && idx < this.props.pattern['pt'].length) {
        pre.push(post.shift());
        idx++;
      }

      this.preLine.setPath(pre);
      this.postLine.setPath(post);

      this.setState({
        prePattern: pre,
        postPattern: post,
        locIdx: idx
      });
    }
  }

  componentWillUnmount() {
    this.preLine.setMap(null);
    this.postLine.setMap(null);
  }
}


module.exports = Pattern;
