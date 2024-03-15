import {io} from 'socket.io-client';
const server = 'https://quizapp-co5u5j43yq-de.a.run.app';

export default io(server, {
  autoConnect: false,
  withCredentials: true,
});
