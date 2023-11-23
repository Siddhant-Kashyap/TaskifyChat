const http = require('http');
const express = require('express');
const app = express(); 
const server = http.createServer(app);

const { readChatHistory, writeChatHistory } = require('./chat/chatHistoryUtils');

const io = require('socket.io')(server, {
    cors: {
        origin: "https://655fa231ced67223293847ed--elegant-biscuit-6cb116.netlify.app/login", 
        methods: ["GET", "POST"]
    }
});

const emailToSocketMap = new Map();


function handleConnection(socket) {
   // console.log('A user connected');

    socket.on('login', (email) => {
        emailToSocketMap.set(email, socket.id);
       // console.log(`User logged in with email: ${email}`);
    });

    socket.on('disconnect', () => {
     
        emailToSocketMap.forEach((socketID, email) => {
            if (socketID === socket.id) {
                emailToSocketMap.delete(email);
            }
        });
    });

    socket.on('chat message', async (data) => {
        const { sender, recipient, message } = data;
      
        const senderSocketID = emailToSocketMap.get(sender);
        const recipientSocketID = emailToSocketMap.get(recipient);

        if (senderSocketID && recipientSocketID) {
            io.to(recipientSocketID).emit('chat message', { sender, message });

            // Save message to chat history
            const chatHistory = await readChatHistory();
            chatHistory.push(data);
            await writeChatHistory(chatHistory);
            io.to(senderSocketID).emit('chat-history', chatHistory.filter(entry => (entry.sender === sender && entry.recipient === recipient) || (entry.sender === recipient && entry.recipient === sender)));
            io.to(recipientSocketID).emit('chat-history', chatHistory.filter(entry => (entry.sender === sender && entry.recipient === recipient) || (entry.sender === recipient && entry.recipient === sender)));
         
        } else {
            console.log(`One or both email addresses not found: ${sender}, ${recipient}`);
        }
    });
    socket.on('chat-history',async(email,recipient)=>{
        try {
            const chatHistory = await readChatHistory();
            // console.log(`SENDER: ${email}`)
            // console.log(`RECIEVER: ${recipient}`)
            
            const userChatHistory = chatHistory.filter((entry) => {
                      return (entry.sender === email && entry.recipient === recipient)||(entry.sender === recipient && entry.recipient === email);
            });
            // console.log("user chat History",userChatHistory);
            socket.emit('chat-history',userChatHistory);
            
        } catch (error) {
            console.log("Error fetching History ",error) 
        }
    })
}

io.on('connection', handleConnection);

server.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
