const io = require('socket.io')(3000, {
        cors: {
            origin: '*',
        },
    });

    const users = {};
    const calls = {}; // Track users in calls

    io.on('connection', (socket) => {
        socket.on('join', (userId) => {
            users[userId] = socket.id;
            socket.userId = userId;
            console.log(`User ${userId} joined with socket ID: ${socket.id}`);
        });

        socket.on('call', (data) => {
             console.log("Call data:", data);
                const callerId = data.from;
                const calleeId = data.to;
                const callerName = data.name; // Get the name from the data

                calls[callerId] = calls[callerId] || {};
                calls[calleeId] = calls[calleeId] || {};

                calls[callerId][calleeId] = { caller: callerId, callee: calleeId, callerName: callerName }; //Store the name
                calls[calleeId][callerId] = { caller: callerId, callee: calleeId, callerName: callerName };

                io.to(users[calleeId]).emit('incomingCall', { from: callerId, name: callerName }); //send the name.
            });

        socket.on('joinCall', (data) => {
            const callerId = data.caller;
            const calleeId = data.callee;

            // Notify the caller that the callee has joined
            io.to(users[callerId]).emit('userJoined', { callee: calleeId });
        });

        socket.on('offer', (data) => {
            if (users[data.to]) {
                io.to(users[data.to]).emit('offer', data);
            }
        });

        socket.on('answer', (data) => {
            if (users[data.to]) {
                io.to(users[data.to]).emit('answer', data);
            }
        });

        socket.on('ice-candidate', (data) => {
            if (users[data.to]) {
                io.to(users[data.to]).emit('ice-candidate', data);
            }
        });

        socket.on('hangup', (data) => {
            if (users[data.to]) {
                io.to(users[data.to]).emit('hangup', data);
            }
            if(calls[data.from]){
                delete calls[data.from][data.to];
            }
            if(calls[data.to]){
                delete calls[data.to][data.from];
            }
        });

        socket.on('disconnect', () => {
            delete users[socket.userId];
            console.log(`User ${socket.userId} disconnected`);
        });
    });

    console.log('Signaling server listening on port 3000');