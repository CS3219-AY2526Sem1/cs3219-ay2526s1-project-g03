import '@testing-library/jest-dom';
import React from 'react';

import {TextDecoder, TextEncoder} from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Ensure React is available globally for components that use React.forwardRef
global.React = React;
