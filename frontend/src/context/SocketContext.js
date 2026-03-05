import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (token && user) {
            const newSocket = io('http://localhost:8000', {
                auth: { token },
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else if (socket) {
            socket.close();
            setSocket(null);
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
