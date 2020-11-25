import React from 'react';

class DraggingLayer extends React.Component {

  render() {
    const { el, box = {} } = this.props;
    let newProps = {
      style: {
        ...el.props.style,
        position: 'fixed',
        // 1100: the width of this plugin('.calendar-plugin-container')
        left: box.x - (window.innerWidth - 1100)/2 - 10,
        top: box.y - 42,
        opacity: 0.75,
        width: 'auto',
        minWidth: 145
      }
    };
    let newChildrenProps = {
      title: '' // remove the title
    };
    let newChildren = React.cloneElement(el.props.children, newChildrenProps);
    let newEl = React.cloneElement(el, newProps, newChildren);
    return newEl;
  }
}

export default DraggingLayer;
