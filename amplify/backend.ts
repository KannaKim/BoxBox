import { defineBackend } from '@aws-amplify/backend';
import { sayHello } from './functions/say-hello/resource';

defineBackend({
  sayHello
});