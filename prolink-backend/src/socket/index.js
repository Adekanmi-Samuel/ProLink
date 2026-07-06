/**
 * Socket.IO shared instance accessor
 * Allows services (notifications, etc.) to emit events to connected users
 */
let ioInstance = null;

const setIo = (io) => {
  ioInstance = io;
};

const getIo = () => ioInstance;

module.exports = { setIo, getIo };
