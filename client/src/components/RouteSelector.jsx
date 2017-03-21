var React = require('react');
import RouteSelection from './RouteSelection';



class RouteSelector extends React.Component {
  constructor(props) {
    super(props);

    // this.onClick = this.onClick.bind(this);
    // this.onChange = this.onChange.bind(this);

  }

  render() {
    // console.log('RouteSelector:render()...');
    let style = {
      float: 'left',
      width: 170,
      height: '100%',
      overflowY: 'scroll'
    }

    // const boxes = this.props.routes.map( (r) =>
    //   <RouteSelection value={r} key={r} onCheck={this.props.onCheck}/>
    // );
    let boxes = [];
    let props = this.props;
    boxes.push(<RouteSelection
      rt     ={'All'}
      dir    ={'All'}
      value  ={'All'}
      key    ={'All'}
      checked={props.routes['All']['All']['checked']}
      onCheck={props.onCheck}/>
    )

    Object.keys(this.props.routes).sort().map(function(r) {
      Object.keys(props.routes[r]).sort().map(function(dir) {
        if (r != 'All') {
          boxes.push(<RouteSelection
            rt     ={r}
            dir    ={dir}
            value  ={props.routes[r][dir].name}
            key    ={props.routes[r][dir].name}
            checked={props.routes[r][dir].checked}
            onCheck={props.onCheck}/>
          )
        }
      });
    });


    if (boxes.length) {
      return <div style={style}>{boxes}</div>;
    } else {
      return null;
    }
  }

  componentDidMount() {

  }



}

module.exports = RouteSelector;
