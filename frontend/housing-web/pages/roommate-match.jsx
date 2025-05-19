import React, { useState, useEffect, useRef } from "react";
import { getConversations, getMessages, sendMessage, getUserDetails } from "../src/api";
import { useParams, useNavigate } from "react-router-dom";

const ChatPage = () => {
  const { roommateId } = useParams(); // extract user ID from URL
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]); // conversation list
  const [messages, setMessages] = useState([]); // current chat record
  const [selectedUser, setSelectedUser] = useState(null); // Initialize as null
  const [newMessage, setNewMessage] = useState(""); // new message content
  const [loading, setLoading] = useState({
    conversations: true,
    messages: false,
    userDetails: false
  }); //细分加载状态
  const [error, setError] = useState(null); // error message
  const [authChecked, setAuthChecked] = useState(false);
  const [userType, setUserType] = useState("tenant"); // Added for the new button

  const rawToken = localStorage.getItem("authToken");
  const token = rawToken?.toLowerCase().startsWith("bearer ")
    ? rawToken.slice(7).trim()
    : rawToken;
  const wsRef = useRef(null);
  const [ws, setWS] = useState(null);
  // check authentication status
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/login", { state: { from: `/roommate-match` } });
    }
    setAuthChecked(true);
  }, [navigate, roommateId]);

  // load conversation list and initialize selected user
  useEffect(() => {
    const fetchConversations = async () => {
      if (!authChecked) return; // Wait for auth check

      try {
        setLoading(prev => ({ ...prev, conversations: true }));
        setError(null);
        const response = await getConversations();
        console.log("Conversations response:", response); // add debug log
        
        if (response && Array.isArray(response)) {
          let updatedConversations = [...response];

          // if roommateId exists in URL
          if (roommateId) {
            const existingUser = response.find(
              (conv) => conv.user_id.toString() === roommateId.toString()
            );
            if (!existingUser) {
              try {
                setLoading(prev => ({ ...prev, userDetails: true }));
                const userDetails = await getUserDetails(roommateId);
                console.log("User details:", userDetails); // add debug log
                const newConversation = {
                  user_id: roommateId,
                  username: userDetails.username || `User ${roommateId}`,
                  avatar_url: userDetails.avatar_url ? `/api/images/${userDetails.avatar_url}` : "/head.png",
                  latest_message: "Start a new conversation",
                };
                updatedConversations = [newConversation, ...updatedConversations];
              } catch (error) {
                console.error("Error fetching user details:", error);
                // Even if we can't get user details, still add a placeholder
                const placeholderConversation = {
                  user_id: roommateId,
                  username: `User ${roommateId}`,
                  avatar_url: "/head.png",
                  latest_message: "Start a new conversation",
                };
                updatedConversations = [placeholderConversation, ...updatedConversations];
              } finally {
                setLoading(prev => ({ ...prev, userDetails: false }));
              }
            }
            setSelectedUser(roommateId);
          } else if (updatedConversations.length > 0) {
            setSelectedUser(updatedConversations[0].user_id);
          }
          
          // handle existing conversation avatar path
          updatedConversations = updatedConversations.map(conv => ({
            ...conv,
            avatar_url: conv.avatar_url ? 
              (conv.avatar_url.startsWith('/api') ? conv.avatar_url : `/api/images/${conv.avatar_url}`) 
              : "/head.png"
          }));

          console.log("Updated conversations:", updatedConversations); // add debug log
          setConversations(updatedConversations);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { state: { from: `/roommate-match/${roommateId}` } });
        } else {
          setError("Failed to load conversations. Please try again.");
          // If there's an error but we have roommateId, still show the user
          if (roommateId) {
            const placeholderConversation = {
              user_id: roommateId,
              username: `User ${roommateId}`,
              avatar_url: "/head.png",
              latest_message: "Start a new conversation",
            };
            setConversations([placeholderConversation]);
            setSelectedUser(roommateId);
          }
        }
      } finally {
        setLoading(prev => ({ ...prev, conversations: false }));
      }
    };

    fetchConversations();
  }, [navigate, roommateId, authChecked]);

  useEffect(() => {

    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {

      wsRef.current = new WebSocket(`ws://localhost:8000/api/v1/messages/ws/${selectedUser}?token=${token}`);
      setWS(wsRef.current);

      wsRef.current.onopen = () => console.log("WebSocket opened");
      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setMessages((prev) => [...prev, msg]);
        } catch {
          setMessages((prev) => [...prev, event.data]);
        }
      };
      wsRef.current.onerror = (e) => console.error("WebSocket error", e);
      wsRef.current.onclose = (e) => console.log("WebSocket closed", e);
    }

    return () => {
      // only close when connection is OPEN
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [selectedUser, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  // load messages for selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !authChecked) return;

      try {
        setLoading(prev => ({ ...prev, messages: true }));
        setError(null);
        const response = await getMessages(selectedUser);
        if (response && Array.isArray(response)) {
          setMessages(response);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { state: { from: `/roommate-match/${roommateId}` } });
        } else {
          setError("Failed to load messages. Please try again.");
        }
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };

    fetchMessages();
  }, [selectedUser, navigate, authChecked]);

  const handleUserSelect = (userId) => {
    setSelectedUser(userId); // update selected user
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await sendMessage({
        receiver_id: selectedUser,
        content: newMessage.trim(),
      });

      setNewMessage(""); // clear input box

    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  if (loading.conversations && !conversations.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
              onClick={() => navigate("/recommendation")}
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
              onClick={() => navigate(userType === "landlord" ? "/landlord-profile" : "/tenant-profile")}
              className="w-12 h-12 rounded-full bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex items-center justify-center border-2 border-gray-200"
            >
              <img
                src={userType === "landlord" ? "/landlord-avatar.png" : "/tenant-avatar.png"}
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

      {/* left conversation list */}
      <div className="w-1/3 bg-white border-r flex flex-col mt-16">
        <div className="p-4 border-b flex items-center">
          <button
            onClick={() => navigate("/recommendation")}
            className="!bg-black mr-4 text-white hover:text-gray-800 !rounded"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold">Messages</h2>
          {/* add debug information */}
          <div className="text-sm text-gray-500 ml-4">
            Total conversations: {conversations.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading.conversations ? (
            <div className="p-4 text-center text-gray-500">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.user_id}
                onClick={() => handleUserSelect(conversation.user_id)}
                className={`flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedUser === conversation.user_id ? "bg-gray-100" : ""
                }`}
              >
                <img
                  src={conversation.avatar_url}
                  alt={conversation.username || `User ${conversation.user_id}`}
                  className="w-12 h-12 rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    e.target.src = "/head.png";
                    e.target.onerror = null;
                  }}
                />
                <div className="ml-4 flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {conversation.username || `User ${conversation.user_id}`}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {typeof conversation.latest_message === 'object' 
                      ? conversation.latest_message.content 
                      : (conversation.latest_message || "Start a conversation")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* right chat area */}
      <div className="flex-1 flex flex-col">
        {loading.conversations ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading conversations...
          </div>
        ) : loading.userDetails ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading user details...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : !selectedUser && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No conversations yet. Start a new chat!
          </div>
        ) : !selectedUser ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Please select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* chat header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold flex items-center">
                    
                    {conversations.find((c) => c.user_id === selectedUser)?.username || "New Chat"}
                  </h2>
                </div>
              </div>
            </div>

            {/* message area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {error && (
                <div className="text-red-500 text-center mb-4">{error}</div>
              )}
              {loading.messages ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex mb-4 ${
                      message.sender_id === selectedUser  ?  "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === selectedUser
                          ? "bg-[#E5E5EA] text-black"  
                          : "bg-[#007AFF] text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* input area */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;