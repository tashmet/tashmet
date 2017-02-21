import {EventEmitter} from 'eventemitter3';
import {injectable, decorate} from '@samizdatjs/tiamat';

decorate(injectable(), EventEmitter);

export {EventEmitter};
