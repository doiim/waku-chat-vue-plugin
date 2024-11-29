// Global debug flag
let debug = false;
let verbose = false;

// Getter and setter for debug flag
const getDebugEnabled = () => debug;
const setDebugEnabled = (enabled: boolean) => {
  debug = enabled;

  console.log(
    '%c🐞 Debug Mode: ' + (enabled ? 'On' : 'Off'),
    DEBUG_WARN_STYLES.header
  );
};

// Types
type StyleConfig = {
  header: string;
  label: string;
  content: string;
};

interface WakuMessage {
  type: string;
  data: string;
  timestamp: number;
  author: {
    name: string;
    id: string;
  };
  responseTo?: string;
}

type MessageType = 'text' | 'reaction' | 'system' | 'other';
type Direction = 'sent' | 'received';
type ProtocolStylesType = {
  [key in Direction]: {
    [key in MessageType]: StyleConfig;
  };
};

type FetchingStates = 'begin' | 'alreadyLoading' | 'limitReached' | 'maxAttempts' | 'noCursor' | 'noOptions' | 'end' | 'unknown';
type FetchingStylesType = {
  [key in FetchingStates]: StyleConfig
};


type ObserverStates = 'newCycle' | 'startCycle' | 'stopCycle' | 'killed' | 'alive' | 'unknown';
type ObserverStylesType = {
  [key in ObserverStates]: StyleConfig
};

// Add new type for table data
type TableData = {
  [key: string]: any;
};

const BasicMessage = (message: string, color: string = 'Gray') => {
  if (!debug) return;
  console.log(
    '%c ↪'+ message,
    createStyle(BASE_STYLES.header, { bg: color, text: 'white' })
  );
};

const ObjectMessage = (title: string, data: TableData) => {
  if (!debug) return;

  console.log(
    '%c📊 ' + title,
    OBJECT_STYLES.header,
    data
  );
};

const ObserverMessages = (state: ObserverStates) => {
  if (!debug) return;
  
  const msgType: ObserverStates = isValidObserverState(state) ? state : 'unknown';
  const styles = OBSERVER_STYLES[msgType];

  let message = '';
  
  switch(state) {
  case 'newCycle':
    message = 'Still visible, starting cycle iteration';
    break;
  case 'startCycle':
    message = 'Detected, starting first cycle';
    break;
  case 'stopCycle':
    message = 'Undetected, stopping cycle interations';
    break;
  case 'killed':
    message = 'Not tracking anything';
    break;
  case 'alive':
    message = 'Tracking scroll position';
    break;
  case 'unknown':
    message = 'Unknown observer state';
    break;
  }
  console.log(
    '%c🧿 observer: %c' + state.charAt(0).toUpperCase() + state.slice(1) + ' -%c' + message,
    styles.header,
    styles.label,
    styles.content
  );
};

const FetchingMessages = (state: FetchingStates) => {
  if (!debug) return;
  const msgType: FetchingStates = isValidFetchingState(state) ? state : 'unknown';
  const styles = FETCHING_STYLES[msgType];

  let message = '';
  
  switch(state) {
    case 'begin':
      message = 'Start fetching older messages...';
      break;
    case 'alreadyLoading':
      message = 'Skipping: Already in a fetch cycle';
      break;
    case 'limitReached':
      message = 'Aborting: Reached message limit';
      break;
    case 'maxAttempts':
      message = 'Pausing: Exceeded fetch attempts';
      break;
    case 'noCursor':
      message = 'Retrying: No cursor available';
      break;
    case 'noOptions':
      message = 'Aborting: Missing options on chat state';
      break;
    case 'end':
      message = 'Ending fetch cycle';
      break;
    case 'unknown':
      message = 'Unknown fetching state';
      break;
  }

  console.log(
    '%c🧭 fetching: %c' + state.charAt(0).toUpperCase() + state.slice(1) + ' -%c' + message,
    styles.header,
    styles.label,
    styles.content
  );
};

const ProtocolMessages = (message: WakuMessage, direction: Direction = 'received') => {
  if (!debug) return;

  const msgType: MessageType = isValidMessageType(message.type) ? message.type : 'other';
  const styles = PROTOCOL_STYLES[direction][msgType] || PROTOCOL_STYLES[direction]['other'];
  
  if(verbose){
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    console.log(
      '%c💬 Message ' + direction + ' at ' + timestamp + '%c\n' +
      '%cType    :%c' + message.type + '%c\n' +
      '%cContent :%c' + trimContent(message.data) + '%c\n' +
      '%cFrom    :%c ' + trimContent(message.author.name, 15) + ' (' + trimContent(message.author.id, 15) + ')'  + '%c\n' +
      '%cReply to:%c ' + (message.responseTo ? trimContent(message.responseTo): ""),
      styles.header, '',
      styles.label, styles.content, '',
      styles.label, styles.content, '',
      styles.label, styles.content, '',
      styles.label, styles.content, ''
    );
  }
  else
    console.log(
      '%c💬 ' + direction + ': %c' + message.type + ' -%c' + trimContent(message.data),
      styles.header,
      styles.label,
      styles.content
    );
};

// Helper functions
const trimContent = (content: string, size: number = 30) => {
  return content.length > size ? content.substring(0, size) + '...' : content;
}

const isValidMessageType = (type: string): type is MessageType => {
  return ['text', 'reaction', 'system', 'other'].includes(type);
};

const isValidObserverState = (state: string): state is FetchingStates => {
  return ['newCycle', 'startCycle', 'stopCycle', 'alive', 'killed', 'unknown'].includes(state);
};

const isValidFetchingState = (state: string): state is FetchingStates => {
  return ['begin', 'alreadyLoading', 'limitReached', 'maxAttempts', 'noCursor', 'noOptions', 'end', 'unknown'].includes(state);
};

const createStyle = (baseStyle: string[], colors: { bg: string, text: string }) => {
  return [
    `background-color: ${colors.bg}`,
    `color: ${colors.text}`,
    ...baseStyle
  ].join(';');
};


// Base styles that are common across all types
const BASE_STYLES = {
  header: [
    'font-weight: bold',
    'padding: 4px 8px',
    'border-radius: 4px',
    'margin: 0px',
    'margin-right: 8px'
  ] as string[],
  label: [
    'padding: 4px 8px',
    'font-weight: bold',
    'margin: 0px',
    'border-radius: 4px 0 0 4px'
  ] as string[],
  content: [
    'padding: 4px 8px',
    'margin: 0px',
    'border-radius: 0 4px 4px 0'
  ] as string[]
};

// Styles

const DEBUG_WARN_STYLES = {
  header: createStyle(BASE_STYLES.header, { bg: '#3B3B3B', text: 'white' }),
};

const OBJECT_STYLES = {
  header: createStyle(BASE_STYLES.header, { bg: 'gray', text: 'white' }),
};

const OBSERVER_STYLES: ObserverStylesType = {
  startCycle: {
    header: createStyle(BASE_STYLES.header, { bg: '#f09b07', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#facc8c', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffefcd', text: '#333' })
  },
  newCycle: {
    header: createStyle(BASE_STYLES.header, { bg: '#f08f3a', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#f2c59d', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#fff0e3', text: '#333' })
  },
  stopCycle: {
    header: createStyle(BASE_STYLES.header, { bg: '#cc6600', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffcc99', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#fff2e6', text: '#333' })
  },
  killed: {
    header: createStyle(BASE_STYLES.header, { bg: '#b35400', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffcda1', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe7d4', text: '#333' })
  },
  alive: {
    header: createStyle(BASE_STYLES.header, { bg: '#dec000', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#fffb91', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#f5f7d2', text: '#333' })
  },
  unknown: {
    header: createStyle(BASE_STYLES.header, { bg: '#ff0000', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffcccc', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe6e6', text: '#333' })
  }
} as const;


const FETCHING_STYLES: FetchingStylesType = {
  begin: {
    header: createStyle(BASE_STYLES.header, { bg: '#b200ff', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#e5aaff', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#f4ddff', text: '#333' })
  },
  alreadyLoading: {
    header: createStyle(BASE_STYLES.header, { bg: '#ff47fc', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#faaaf9', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe8ff', text: '#333' })
  },
  limitReached:{
    header: createStyle(BASE_STYLES.header, { bg: '#683b82', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#c8a6e3', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#dfd1eb', text: '#333' })
  },	
  maxAttempts:{
    header: createStyle(BASE_STYLES.header, { bg: '#593973', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#a68cbf', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#dbceed', text: '#333' })
  },
  noCursor:{
    header: createStyle(BASE_STYLES.header, { bg: '#ff0000', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffa6a6', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe8e8', text: '#333' })
  },
  noOptions: {
    header: createStyle(BASE_STYLES.header, { bg: '#ff0000', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffa6a6', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe8e8', text: '#333' })
  },
  end: {
    header: createStyle(BASE_STYLES.header, { bg: '#9900cc', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#cc99ff', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#f2e6ff', text: '#333' })
  },
  unknown: {
    header: createStyle(BASE_STYLES.header, { bg: '#ff0000', text: 'white' }),
    label: createStyle(BASE_STYLES.label, { bg: '#ffcccc', text: '#333' }),
    content: createStyle(BASE_STYLES.content, { bg: '#ffe6e6', text: '#333' })
  }
} as const;

const PROTOCOL_STYLES: ProtocolStylesType = {
  received: {
    text: {
      header: createStyle(BASE_STYLES.header, { bg: '#0066cc', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#8cc6ff', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#cae5ff', text: '#333' })
    },
    reaction: {
      header: createStyle(BASE_STYLES.header, { bg: '#0077b3', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#66ccff', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#e6f7ff', text: '#333' })
    },
    system: {
      header: createStyle(BASE_STYLES.header, { bg: '#003d80', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#707da9', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#d0d3df', text: '#333' })
    },
    other: {
      header: createStyle(BASE_STYLES.header, { bg: '#004d99', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#000000', text: '#df352b' }),
      content: createStyle(BASE_STYLES.content, { bg: '#bfc4d7', text: '#333' })
    }
  },
  sent: {
    text: {
      header: createStyle(BASE_STYLES.header, { bg: '#006633', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#99cc99', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#e6ffe6', text: '#333' })
    },
    reaction: {
      header: createStyle(BASE_STYLES.header, { bg: '#006d4d', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#99d6c2', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#e6f7f2', text: '#333' })
    },
    system: {
      header: createStyle(BASE_STYLES.header, { bg: '#294133', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#819d8d', text: '#333' }),
      content: createStyle(BASE_STYLES.content, { bg: '#c6cdca', text: '#333' })
    },
    other: {
      header: createStyle(BASE_STYLES.header, { bg: '#006934', text: 'white' }),
      label: createStyle(BASE_STYLES.label, { bg: '#000000', text: '#df352b' }),
      content: createStyle(BASE_STYLES.content, { bg: '#c6cdca', text: '#333' })
    }
  },
} as const;


export default {
  BasicMessage,
  ObserverMessages,
  FetchingMessages,
  ProtocolMessages,
  ObjectMessage,
  getDebugEnabled,
  setDebugEnabled
}; 