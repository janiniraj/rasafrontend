import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';

import { MESSAGES_TYPES } from 'constants';
import { Video, Image, Message, Snippet, QuickReply } from 'messagesComponents';

import './styles.scss';

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const formatDate = (date) => {
  const dateToFormat = new Date(date);
  const showDate = isToday(dateToFormat) ? '' : `${dateToFormat.toLocaleDateString()} `;
  return `${showDate}${dateToFormat.toLocaleTimeString('en-US', { timeStyle: 'short' })}`;
};

const scrollToBottom = () => {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

class Messages extends Component {
  componentDidMount() {
    scrollToBottom();
  }

  componentDidUpdate() {
    scrollToBottom();
  }

  getComponentToRender = (message, index, isLast) => {
    const { params } = this.props;
    const ComponentToRender = (() => {
      switch(message.get('type')){
        case MESSAGES_TYPES.TEXT: {
          return Message
        }
        case MESSAGES_TYPES.SNIPPET.LINK: {
          return Snippet
        }
        case MESSAGES_TYPES.VIDREPLY.VIDEO: {
          return Video
        }
        case MESSAGES_TYPES.IMGREPLY.IMAGE: {
          return Image
        }
        case MESSAGES_TYPES.QUICK_REPLY: {
          return QuickReply
        }
        case MESSAGES_TYPES.CUSTOM_COMPONENT:
          return connect(
            store => ({ store }),
            dispatch => ({ dispatch })
          )(this.props.customComponent);
      }
      return null
    })()
    if (message.get('type') === 'component') {
      return <ComponentToRender id={index} {...message.get('props')} isLast={isLast}/>;
    }
    return <ComponentToRender id={index} params={params} message={message} isLast={isLast} />;
  }

  render() {
    const renderMessages = () => {
      const {
        messages,
        showMessageDate,
        profileAvatar
      } = this.props;

      if (messages.isEmpty()) return null;

      const groups = [];
      let group = null;

      const dateRenderer = typeof showMessageDate === 'function' ? showMessageDate :
        showMessageDate === true ? formatDate : null;

      const renderMessageDate = (message) => {
        const timestamp = message.get('timestamp');

        if (!dateRenderer || !timestamp) return null;
        const dateToRender = dateRenderer(message.get('timestamp', message));
        return dateToRender
          ? <span className="message-date">{dateRenderer(message.get('timestamp'), message)}</span>
          : null;
      };

      const renderMessage = (message, index) => (
        <div className="message" key={index}>
          {
            profileAvatar &&
            message.get('showAvatar') &&
            <img src={profileAvatar} className="avatar" alt="profile" />
          }
          { this.getComponentToRender(message, index, index === messages.size - 1) }
          { renderMessageDate(message) }
        </div>
      );

      messages.forEach((msg, index) => {
        if (group === null || group.from !== msg.get('sender')) {
          if (group !== null) groups.push(group);

          group = {
            from: msg.get('sender'),
            messages: []
          };
        }

        group.messages.push(renderMessage(msg, index));
      });

      groups.push(group); // finally push last group of messages.

      return groups.map((g, index) => (
        <div className={`group-message from-${g.from}`} key={`group_${index}`}>
          {g.messages}
        </div>
      ));
    };

    return (
      <div id="messages" className="messages-container">
        { renderMessages() }
      </div>
    );
  }
}

Messages.propTypes = {
  messages: ImmutablePropTypes.listOf(ImmutablePropTypes.map),
  profileAvatar: PropTypes.string,
  customComponent: PropTypes.func,
  showMessageDate: PropTypes.oneOfType([PropTypes.bool, PropTypes.func])
};

export default connect(store => ({
  messages: store.messages
}))(Messages);
