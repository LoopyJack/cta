var React = require('react');
// import style from './style/RouteSelectorStyle';
import css from './style/RouteSelector.css';



class RouteSelection extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  render() {

    return (<div style={{width:'100%'}}>
        <label>
          <input
            readOnly={false}
            onClick ={this.onClick}
            onChange={this.onChange}
            type    ='checkbox'
            name    ={this.props.value}
            key     ={this.props.value}
            value   ={this.props.value}
            ref     ={this.props.value}
            checked ={this.props.checked}/>
          {this.props.value}
        </label>
    </div>)
  }

  onClick(e) {
    this.props.onCheck(e.target, this.props.rt, this.props.dir);
  }

  onChange(e) {

  }
}

module.exports = RouteSelection;
