let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

function emitEvent(event, data, room) {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

module.exports = { setIO, emitEvent }; 