import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, getUserDetails } from "../src/api";
import WebSocketManager from "../src/util/WebSocketManager";


const ChatPage = () => {
  const { userId: otherUserId } = useParams();
  const currentUserId = localStorage.getItem("user_id"); // get current user id
  const messagesEndRef = useRef(null);
  // calculate room id
  const roomId = currentUserId < otherUserId
    ? `${currentUserId}_${otherUserId}`
    : `${otherUserId}_${currentUserId}`;

  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // message list
  const [newMessage, setNewMessage] = useState(""); // new message content
  const [loading, setLoading] = useState({
    messages: true,
    userDetails: true,
  }); // loading status
  const [error, setError] = useState(null); // error message
  const [userDetails, setUserDetails] = useState(null); // user details
  const [ws, setWS] = useState(null);
  const wsRef = useRef(null);

  const rawToken = localStorage.getItem("authToken");
  const token = rawToken?.toLowerCase().startsWith("bearer ")
    ? rawToken.slice(7).trim()
    : rawToken;

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsManager = useRef(null);

  // load user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!otherUserId) {
        console.log("No userId provided");
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, userDetails: true }));
        const response = await getUserDetails(otherUserId);
        console.log("User details response:", response);
        setUserDetails(response);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError("Failed to load user details.");
      } finally {
        setLoading((prev) => ({ ...prev, userDetails: false }));
      }
    };

    fetchUserDetails();
  }, [otherUserId]);

  // load message list
  useEffect(() => {
    const fetchMessages = async () => {
      if (!otherUserId) {
        console.log("No userId provided");
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, messages: true }));
        const response = await getMessages(otherUserId);
        console.log("Messages response:", response);

        if (!Array.isArray(response)) {
          console.error("Expected array response, got:", typeof response);
          setMessages([]);
          return;
        }

        setMessages(response);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
        setMessages([]);
      } finally {
        setLoading((prev) => ({ ...prev, messages: false }));
      }
    };

    fetchMessages();
  }, [otherUserId]);

  // useEffect(() => {
  //   if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {

  //     wsRef.current = new WebSocket(`ws://localhost:8000/api/v1/messages/ws/${otherUserId}?token=${token}`);
  //     setWS(wsRef.current);

  //     wsRef.current.onopen = () => console.log("WebSocket opened");
  //     wsRef.current.onmessage = (event) => {
  //       try {
  //         const msg = JSON.parse(event.data);
  //         setMessages((prev) => [...prev, msg]);
  //       } catch {
  //         setMessages((prev) => [...prev, event.data]);
  //       }
  //     };
  //     wsRef.current.onerror = (e) => console.error("WebSocket error", e);
  //     wsRef.current.onclose = (e) => console.log("WebSocket closed", e);
  //   }

  //   return () => {
  //     // close only when connection is OPEN
  //     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
  //       wsRef.current.close();
  //     }
  //   };
  // }, [otherUserId, token]);

  useEffect(() => {
    console.log('Initializing WebSocket connection...');
    console.log('Current user ID:', currentUserId);
    console.log('Other user ID:', otherUserId);
    console.log('Token:', token);

    const wsUrl = `ws://localhost:8000/api/v1/messages/ws/${otherUserId}?token=${token}`;
    console.log('WebSocket URL:', wsUrl);

    wsManager.current = new WebSocketManager(wsUrl, {
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 3000,
    });

    wsManager.current.on('open', () => {
      console.log('WebSocket connection opened');
      setConnectionStatus('connected');
    });

    wsManager.current.on('close', (event) => {
      console.log('WebSocket connection closed:', event);
      setConnectionStatus('disconnected');
    });

    wsManager.current.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      setError('Connection error. Attempting to reconnect...');
    });

    wsManager.current.on('message', (data) => {
      console.log('Received WebSocket message:', data);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const messageExists = prev.some(msg => msg.id === data.id);
        if (messageExists) {
          console.log('Message already exists, skipping:', data.id);
          return prev;
        }
        console.log('Adding new message:', data.id);
        return [...prev, data];
      });
    });

    wsManager.current.on('maxRetriesReached', () => {
      console.log('Max retries reached for WebSocket connection');
      setError('Failed to connect after multiple attempts. Please try refresh the page.')
    });

    console.log('Connecting to WebSocket...');
    wsManager.current.connect();

    //for server to test
    // window.testWsManager = wsManager.current;

    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (wsManager.current) {
        wsManager.current.close();
        wsManager.current = null;
      }
    };
  }, [otherUserId, token]);


  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        content: newMessage.trim(),
        receiver_id: parseInt(otherUserId),
      });
      setNewMessage("");
      // no need to setMessages, wait for WebSocket to receive push and update UI
    } catch (error) {
      setError("Failed to send message. Please try again.");
    }
  };




  if (loading.messages || loading.userDetails) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* top navigation bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <h1 
            onClick={() => navigate("/recommendation")}
            className="text-2xl font-bold text-black cursor-pointer hover:text-gray-700 transition-colors"
          >
            UniNest
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/roommate-match")}
              className="w-10 h-10 rounded-full bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex items-center justify-center border-2 border-gray-200"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-gray-600 hover:text-gray-800" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </button>
            <button
              onClick={() => navigate("/tenant-profile")}
              className="w-12 h-12 rounded-full bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex items-center justify-center border-2 border-gray-200"
            >
              <img
                src="/tenant-avatar.png"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "../head.png";
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-16">
        <div className="flex flex-col h-screen bg-gray-100">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/recommendation")}
                  className="mr-4 px-3 py-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 transition"
                >
                  ← Back
                </button>
                <div className="flex items-center">
                  <img
                    src={userDetails?.avatar_url || "/head.png"}
                    alt={userDetails?.username || "User"}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <h1 className="text-xl font-semibold text-gray-900">
                    {userDetails?.username || "Chat"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-[#f8f9fa] px-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
                {error}
              </div>
            )}
            <div className="max-w-3xl mx-auto py-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div key={index} className="flex flex-col">
                    {/* username */}
                    <div
                      className={`mb-1 text-sm ${
                        message.sender_id === parseInt(otherUserId)
                          ? "text-left text-gray-600"
                          : "text-right text-gray-600"
                      }`}
                    >
                      {message.sender_id === parseInt(otherUserId)
                        ? userDetails?.username || "User"
                        : "You"}
                    </div>

                    {/* message bubble */}
                    <div
                      className={`flex ${
                        message.sender_id === parseInt(otherUserId) ? "justify-start" : "justify-end"
                      }`}
                    >
                      {message.sender_id === parseInt(otherUserId) && (
                        <div className="flex-shrink-0 mr-3">
                          <img
                            src={userDetails?.avatar_url || "/head.png"}
                            alt={userDetails?.username || "User"}
                            className="w-8 h-8 rounded-full"
                          />
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-[20px] max-w-[75%] ${
                          message.sender_id === parseInt(otherUserId)
                            ? "bg-white text-black rounded-bl-[5px] shadow-sm"
                            : "bg-[#0084ff] text-white rounded-br-[5px]"
                        }`}
                      >
                        <p className="text-[15px] leading-[1.4]">{message.content}</p>
                      </div>
                    </div>

                    {/* timestamp */}
                    <div
                      className={`mt-1 text-xs ${
                        message.sender_id === parseInt(otherUserId) ? "text-left" : "text-right"
                      } text-gray-500`}
                    >
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : ""}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start a conversation!
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-4 py-3 fixed bottom-0 left-0 right-0">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="!bg-black text-white px-6 py-2 rounded-full hover:!bg-gray-800 disabled:!bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;